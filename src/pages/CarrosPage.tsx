import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Carro {
  id: string;
  codigo: string;
  descricao: string | null;
  status: string;
  em_manutencao: boolean;
  ultima_atualizacao: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  em_vaga: 'Em vaga',
  sem_vaga: 'Sem localização',
  em_local_externo: 'Local externo',
  em_manutencao: 'Em manutenção',
  inativo: 'Inativo',
};

const STATUS_COR: Record<string, string> = {
  em_vaga: 'bg-green-100 text-green-700',
  sem_vaga: 'bg-yellow-100 text-yellow-700',
  em_local_externo: 'bg-purple-100 text-purple-700',
  em_manutencao: 'bg-orange-100 text-orange-700',
  inativo: 'bg-gray-100 text-gray-500',
};

export const CarrosPage = () => {
  const navigate = useNavigate();
  const [carros, setCarros] = useState<Carro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [busca, setBusca] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // campos do formulário
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');

  const carregar = useCallback(() => {
    setCarregando(true);
    supabase
      .from('carros')
      .select('id, codigo, descricao, status, em_manutencao, ultima_atualizacao')
      .order('codigo')
      .then(({ data, error }) => {
        if (error) setErro('Erro ao carregar carros: ' + error.message);
        else setCarros(data || []);
        setCarregando(false);
      });
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const codigoLimpo = codigo.trim();
    if (!codigoLimpo) {
      setErro('Digite o código do carro.');
      return;
    }
    if (codigoLimpo.length > 5) {
      setErro('O código deve ter no máximo 5 caracteres.');
      return;
    }

    setSalvando(true);
    const { data, error } = await supabase.rpc('criar_carro', {
      p_numero_serie: codigoLimpo,
      p_descricao: descricao.trim() || null,
    });
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(`Carro "${data.codigo}" cadastrado com sucesso!`);
    setCodigo('');
    setDescricao('');
    setMostrarForm(false);
    carregar();
  };

  const carrosFiltrados = carros.filter((c) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      c.codigo.toLowerCase().includes(termo) ||
      (c.descricao && c.descricao.toLowerCase().includes(termo))
    );
  });

  const resumo = {
    total: carros.length,
    emVaga: carros.filter((c) => c.status === 'em_vaga').length,
    semVaga: carros.filter((c) => c.status === 'sem_vaga').length,
    manutencao: carros.filter((c) => c.em_manutencao).length,
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-xl font-bold text-mro-azul">🚗 Gestão de Carros</h1>
        <button
          onClick={() => { setMostrarForm((v) => !v); setErro(''); setSucesso(''); }}
          className="bg-mro-azul text-white text-sm px-4 py-2 rounded hover:bg-mro-azul-claro"
        >
          {mostrarForm ? '✕ Cancelar' : '➕ Adicionar Carro'}
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-4">
          ⚠️ {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded px-3 py-2 mb-4">
          ✅ {sucesso}
        </div>
      )}

      {/* Formulário de criação */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h2 className="font-semibold text-mro-azul mb-1">Cadastrar novo carro</h2>
          <p className="text-xs text-gray-400 mb-4">
            O código pode ter até 5 caracteres (ex: <strong>123</strong>, <strong>10040</strong>, <strong>AB001</strong>).
          </p>
          <form onSubmit={handleCriar}>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[160px]">
                <label className="block text-sm text-gray-600 mb-1">Código do carro</label>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.slice(0, 5))}
                  placeholder="Ex: 10040"
                  maxLength={5}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  {codigo.trim().length}/5 caracteres
                </p>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-gray-600 mb-1">
                  Descrição <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Carrinho elétrico, cor azul"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={salvando}
                className="bg-mro-verde text-white text-sm px-5 py-2 rounded hover:opacity-90 disabled:opacity-50 font-medium"
              >
                {salvando ? 'Salvando...' : '✅ Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-mro-azul">{resumo.total}</div>
          <div className="text-xs text-gray-500">Total de carros</div>
        </div>
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-green-600">{resumo.emVaga}</div>
          <div className="text-xs text-gray-500">Em vaga</div>
        </div>
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-yellow-600">{resumo.semVaga}</div>
          <div className="text-xs text-gray-500">Sem localização</div>
        </div>
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-orange-500">{resumo.manutencao}</div>
          <div className="text-xs text-gray-500">Em manutenção</div>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-4 max-w-sm">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔍 Buscar por código ou descrição..."
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Tabela */}
      {carregando ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-3 whitespace-nowrap">Código</th>
                <th className="p-3 whitespace-nowrap">Descrição</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 whitespace-nowrap">Última atualização</th>
                <th className="p-3 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    Nenhum carro encontrado.
                  </td>
                </tr>
              ) : (
                carrosFiltrados.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap font-medium">{c.codigo}</td>
                    <td className="p-3 text-gray-500">{c.descricao || '—'}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COR[c.status] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-gray-400">
                      {c.ultima_atualizacao
                        ? new Date(c.ultima_atualizacao).toLocaleString()
                        : '—'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/carro/${c.id}/editar`)}
                          title="Editar"
                          className="p-1.5 rounded hover:bg-gray-100 text-lg"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => navigate(`/transferir/${c.id}`)}
                          title="Atualizar localização"
                          className="p-1.5 rounded hover:bg-gray-100 text-lg"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => navigate(`/auditoria-carros`)}
                          title="Ver histórico"
                          className="p-1.5 rounded hover:bg-gray-100 text-lg"
                        >
                          🔎
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 p-3">
            {carrosFiltrados.length} de {carros.length} carros exibidos
          </p>
        </div>
      )}
    </div>
  );
};