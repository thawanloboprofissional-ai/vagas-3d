import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePerfil } from '../context/PerfilContext';

interface ResultadoItem {
  termoBuscado: string;
  status: 'encontrado' | 'nao_encontrado' | 'ambiguo';
  dados?: any;
  totalCandidatos?: number;
}

const MAX_CODIGOS = 100;

function parsearCodigos(texto: string): string[] {
  const termos = texto
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return Array.from(new Set(termos));
}

export const BuscaLotePage = () => {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<ResultadoItem[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();
  const { perfil } = usePerfil();
  const podeEditar = perfil === 'admin';

  const handleBuscar = async () => {
    setErro('');
    const codigos = parsearCodigos(texto);

    if (codigos.length === 0) {
      setErro('Cole ao menos um código de carro para buscar.');
      return;
    }
    if (codigos.length > MAX_CODIGOS) {
      setErro(`Limite de ${MAX_CODIGOS} códigos por busca. Você colou ${codigos.length}.`);
      return;
    }

    setBuscando(true);
    setResultados(null);

    const respostas = await Promise.all(
      codigos.map((termo) => supabase.rpc('buscar_carros_global', { p_search: termo }))
    );

    const novosResultados: ResultadoItem[] = codigos.map((termo, i) => {
      const { data, error } = respostas[i];
      if (error || !data || data.length === 0) {
        return { termoBuscado: termo, status: 'nao_encontrado' };
      }
      if (data.length === 1) {
        return { termoBuscado: termo, status: 'encontrado', dados: data[0] };
      }
      const exato = data.find((d: any) => d.codigo.toLowerCase() === termo.toLowerCase());
      if (exato) {
        return { termoBuscado: termo, status: 'encontrado', dados: exato };
      }
      return { termoBuscado: termo, status: 'ambiguo', totalCandidatos: data.length };
    });

    setResultados(novosResultados);
    setBuscando(false);
  };

  const handleLimpar = () => {
    setTexto('');
    setResultados(null);
    setErro('');
  };

  const localizacaoDe = (d: any) => {
    if (d.tipo_especial) return `⚠️ ${d.tipo_especial}`;
    if (d.status === 'em_manutencao') return '🔧 Em manutenção';
    if (d.local_externo_nome) return `📍 ${d.local_externo_nome}`;
    if (d.galpao_nome) return `🅿️ ${d.galpao_nome} · Rua ${d.rua} · ${d.vaga_codigo}`;
    return 'Sem localização atual';
  };

  const corStatus = (status: string) => {
    if (status === 'em_vaga') return 'bg-green-600';
    if (status === 'em_local_externo') return 'bg-purple-600';
    if (status === 'em_manutencao') return 'bg-orange-600';
    if (status === 'sem_vaga') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const encontrados = resultados?.filter((r) => r.status === 'encontrado') || [];
  const naoEncontrados = resultados?.filter((r) => r.status === 'nao_encontrado') || [];
  const ambiguos = resultados?.filter((r) => r.status === 'ambiguo') || [];

  const exportarCSV = () => {
    if (!resultados) return;
    const cabecalho = ['Código buscado', 'Status da busca', 'Código real', 'Situação', 'Localização', 'Última atualização', 'Responsável'];
    const linhas = resultados.map((r) => {
      if (r.status === 'encontrado' && r.dados) {
        return [
          r.termoBuscado,
          'Encontrado',
          r.dados.codigo,
          r.dados.tipo_especial || r.dados.status,
          localizacaoDe(r.dados).replace(/^[^\s]+\s/, ''),
          new Date(r.dados.ultima_atualizacao).toLocaleString(),
          r.dados.ultima_atualizacao_por || '—',
        ];
      }
      if (r.status === 'ambiguo') {
        return [r.termoBuscado, `Ambíguo (${r.totalCandidatos} resultados)`, '', '', '', '', ''];
      }
      return [r.termoBuscado, 'Não encontrado', '', '', '', '', ''];
    });
    const csv = [cabecalho, ...linhas].map((l) => l.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'busca_em_lote.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-mro-azul mb-1">🧾 Busca em Lote</h1>
      <p className="text-sm text-gray-500 mb-4">
        Cole vários códigos de uma vez (um por linha, ou separados por vírgula — inclusive dá pra colar direto de uma coluna do Excel) para ver a localização de todos juntos.
      </p>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={'Ex:\nC1-0001\nC1-0002\n10040\n30082'}
          rows={6}
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={handleBuscar}
            disabled={buscando}
            className="bg-mro-azul text-white text-sm px-4 py-2 rounded hover:bg-mro-azul-claro disabled:opacity-50"
          >
            {buscando ? 'Buscando...' : '🔍 Buscar todos'}
          </button>
          <button onClick={handleLimpar} className="text-sm border rounded px-4 py-2 hover:bg-gray-50">
            ✕ Limpar
          </button>
          {texto && (
            <span className="text-xs text-gray-400">
              {parsearCodigos(texto).length} código(s) detectado(s)
            </span>
          )}
        </div>
        {erro && <p className="text-red-600 text-sm mt-2">{erro}</p>}
      </div>

      {resultados && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center bg-white rounded-xl shadow py-3">
              <div className="text-xl font-bold text-mro-azul">{resultados.length}</div>
              <div className="text-xs text-gray-500">Buscados</div>
            </div>
            <div className="text-center bg-white rounded-xl shadow py-3">
              <div className="text-xl font-bold text-green-600">{encontrados.length}</div>
              <div className="text-xs text-gray-500">Encontrados</div>
            </div>
            <div className="text-center bg-white rounded-xl shadow py-3">
              <div className="text-xl font-bold text-red-600">{naoEncontrados.length}</div>
              <div className="text-xs text-gray-500">Não encontrados</div>
            </div>
            <div className="text-center bg-white rounded-xl shadow py-3">
              <div className="text-xl font-bold text-yellow-600">{ambiguos.length}</div>
              <div className="text-xs text-gray-500">Ambíguos</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto mb-4">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="font-semibold text-sm">Resultados</h2>
              <button onClick={exportarCSV} className="text-xs border rounded px-3 py-1.5 hover:bg-gray-50">⬇️ Exportar CSV</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="p-3 whitespace-nowrap">Buscado</th>
                  <th className="p-3 whitespace-nowrap">Código real</th>
                  <th className="p-3 whitespace-nowrap">Situação</th>
                  <th className="p-3 whitespace-nowrap">Localização</th>
                  <th className="p-3 whitespace-nowrap">Última atualização</th>
                  <th className="p-3 whitespace-nowrap">Responsável</th>
                  <th className="p-3 whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r, i) => {
                  if (r.status === 'nao_encontrado') {
                    return (
                      <tr key={i} className="border-b bg-red-50">
                        <td className="p-3 whitespace-nowrap font-medium">{r.termoBuscado}</td>
                        <td colSpan={6} className="p-3 text-red-600 text-xs">❌ Não encontrado no sistema</td>
                      </tr>
                    );
                  }
                  if (r.status === 'ambiguo') {
                    return (
                      <tr key={i} className="border-b bg-yellow-50">
                        <td className="p-3 whitespace-nowrap font-medium">{r.termoBuscado}</td>
                        <td colSpan={6} className="p-3 text-yellow-700 text-xs">
                          ⚠️ {r.totalCandidatos} carros correspondem a este termo — refine a busca (ex: use o código completo)
                        </td>
                      </tr>
                    );
                  }
                  const d = r.dados;
                  return (
                    <tr key={i} className="border-b">
                      <td className="p-3 whitespace-nowrap text-gray-400">{r.termoBuscado}</td>
                      <td className="p-3 whitespace-nowrap font-medium">{d.codigo}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`text-white text-xs px-2 py-0.5 rounded ${corStatus(d.status)}`}>
                          {d.tipo_especial || d.status}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">{localizacaoDe(d)}</td>
                      <td className="p-3 whitespace-nowrap text-gray-400">{new Date(d.ultima_atualizacao).toLocaleString()}</td>
                      <td className="p-3 whitespace-nowrap text-gray-400">{d.ultima_atualizacao_por || '—'}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          {podeEditar && (
                            <button onClick={() => navigate(`/carro/${d.carro_id}/editar`)} title="Editar" className="p-1.5 rounded hover:bg-gray-100">✏️</button>
                          )}
                          <button onClick={() => navigate(`/transferir/${d.carro_id}`)} title="Atualizar Localização" className="p-1.5 rounded hover:bg-gray-100">🔄</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};