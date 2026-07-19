import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORIAS = [
  'Roda quebrada', 'Trava U quebrada', 'Assoalho quebrado', 'Outro',
];

const STATUS_FLUXO = [
  'aguardando_avaliacao', 'aguardando_aprovacao', 'aguardando_pecas',
  'em_reparo', 'em_testes', 'pronto_liberacao',
];

const STATUS_LABEL: Record<string, string> = {
  aguardando_avaliacao: 'Aguardando Avaliação',
  aguardando_aprovacao: 'Aguardando Aprovação',
  aguardando_pecas: 'Aguardando Peças',
  em_reparo: 'Em Reparo',
  em_testes: 'Em Testes',
  pronto_liberacao: 'Pronto para Liberação',
  liberado: 'Liberado',
};

const LIMITE_DIAS_VENCIDA = 7;
const LIMITE_DIAS_PECAS = 5;
const LIMITE_HORAS_TESTES = 48;
const LIMITE_DIAS_SEM_ATUALIZACAO = 3;

function diffPartes(inicio: string, fim: Date = new Date()) {
  const ms = fim.getTime() - new Date(inicio).getTime();
  const dias = Math.floor(ms / 86400000);
  const horas = Math.floor((ms % 86400000) / 3600000);
  const minutos = Math.floor((ms % 3600000) / 60000);
  return { dias, horas, minutos, ms };
}

function formatarDuracao(ms: number) {
  const horas = Math.floor(ms / 3600000);
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  return `${dias}d ${horas % 24}h`;
}

export const ManutencaoPage = () => {
  const [ativas, setAtivas] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [totalFrota, setTotalFrota] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [, setTick] = useState(0);

  const [buscaCarro, setBuscaCarro] = useState('');
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [carroEscolhido, setCarroEscolhido] = useState<any>(null);
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [liberando, setLiberando] = useState<any>(null);
  const [obsFinais, setObsFinais] = useState('');

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const carregar = useCallback(() => {
    setCarregando(true);
    setErro('');
    Promise.all([
      supabase
        .from('manutencoes')
        .select('*, carros!manutencoes_carro_id_fkey(codigo, descricao)')
        .neq('status', 'liberado')
        .order('entrada', { ascending: false }),
      supabase
        .from('manutencoes')
        .select('*, carros!manutencoes_carro_id_fkey(codigo)')
        .eq('status', 'liberado')
        .order('saida', { ascending: false })
        .limit(200),
      supabase.from('carros').select('id', { count: 'exact', head: true }),
    ]).then(([ativasRes, histRes, totalRes]) => {
      if (ativasRes.error) {
        console.error('Erro ao buscar manutenções ativas:', ativasRes.error);
        setErro('Erro ao carregar manutenções ativas: ' + ativasRes.error.message);
      }
      if (histRes.error) {
        console.error('Erro ao buscar histórico:', histRes.error);
        setErro((atual) => atual || 'Erro ao carregar histórico: ' + histRes.error!.message);
      }
      setAtivas(ativasRes.data || []);
      setHistorico(histRes.data || []);
      setTotalFrota(totalRes.count || 0);
      setCarregando(false);
    });
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const buscarSugestoes = async (termo: string) => {
    setBuscaCarro(termo);
    setCarroEscolhido(null);
    if (termo.length < 2) {
      setSugestoes([]);
      return;
    }
    const { data } = await supabase
      .from('carros')
      .select('id, codigo, em_manutencao')
      .ilike('codigo', `%${termo}%`)
      .limit(8);
    setSugestoes(data || []);
  };

  const handleEnviar = async () => {
    setErro('');
    if (!carroEscolhido) return setErro('Selecione um carro.');
    if (carroEscolhido.em_manutencao) return setErro('Este carro já está em manutenção.');
    if (!categoria) return setErro('Selecione a categoria do motivo.');
    setEnviando(true);
    const { error } = await supabase.rpc('enviar_para_manutencao', {
      p_carro_id: carroEscolhido.id,
      p_motivo_categoria: categoria,
      p_motivo_descricao: descricao || null,
    });
    setEnviando(false);
    if (error) return setErro(error.message);
    setBuscaCarro('');
    setCarroEscolhido(null);
    setCategoria('');
    setDescricao('');
    setMostrarForm(false);
    carregar();
  };

  const handleTrocarStatus = async (manutencaoId: string, novoStatus: string) => {
    const { error } = await supabase.rpc('atualizar_status_manutencao', {
      p_manutencao_id: manutencaoId,
      p_novo_status: novoStatus,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    carregar();
  };

  const handleLiberar = async () => {
    if (!liberando) return;
    const { error } = await supabase.rpc('liberar_veiculo', {
      p_manutencao_id: liberando.id,
      p_observacoes_finais: obsFinais || null,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setLiberando(null);
    setObsFinais('');
    carregar();
  };

  const indicadores = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const porStatus: Record<string, number> = {};
    STATUS_FLUXO.forEach((s) => (porStatus[s] = 0));
    let vencidas = 0;

    ativas.forEach((m) => {
      porStatus[m.status] = (porStatus[m.status] || 0) + 1;
      const { dias } = diffPartes(m.entrada);
      if (dias > LIMITE_DIAS_VENCIDA) vencidas++;
    });

    const entradasHoje = ativas.filter((m) => new Date(m.entrada) >= hoje).length +
      historico.filter((m) => new Date(m.entrada) >= hoje).length;
    const saidasHoje = historico.filter((m) => m.saida && new Date(m.saida) >= hoje).length;

    const finalizadas = historico.filter((m) => m.saida);
    const tempoMedioMs = finalizadas.length
      ? finalizadas.reduce((acc, m) => acc + (new Date(m.saida).getTime() - new Date(m.entrada).getTime()), 0) / finalizadas.length
      : 0;

    return {
      totalAtivas: ativas.length,
      percentualIndisponivel: totalFrota ? Math.round((ativas.length / totalFrota) * 100) : 0,
      porStatus,
      tempoMedio: tempoMedioMs ? formatarDuracao(tempoMedioMs) : '—',
      entradasHoje,
      saidasHoje,
      aguardandoPecas: porStatus['aguardando_pecas'] || 0,
      vencidas,
    };
  }, [ativas, historico, totalFrota]);

  const alertaDoItem = (m: any) => {
    const { dias, horas } = diffPartes(m.entrada);
    const atualizadoHoras = diffPartes(m.atualizado_em).horas + diffPartes(m.atualizado_em).dias * 24;

    if (dias > LIMITE_DIAS_VENCIDA) return { cor: '🔴', label: `Parado há mais de ${LIMITE_DIAS_VENCIDA} dias` };
    if (m.status === 'aguardando_pecas' && dias > LIMITE_DIAS_PECAS) return { cor: '🟠', label: `Aguardando peças há mais de ${LIMITE_DIAS_PECAS} dias` };
    if (m.status === 'em_testes' && dias * 24 + horas > LIMITE_HORAS_TESTES) return { cor: '🟠', label: `Em testes há mais de ${LIMITE_HORAS_TESTES}h` };
    if (atualizadoHoras > LIMITE_DIAS_SEM_ATUALIZACAO * 24) return { cor: '🟡', label: `Sem atualização há mais de ${LIMITE_DIAS_SEM_ATUALIZACAO} dias` };
    return null;
  };

  const ativasFiltradas = useMemo(() => {
    return ativas.filter((m) => {
      const termo = filtroTexto.trim().toLowerCase();
      const bateTexto = !termo ||
        m.carros?.codigo?.toLowerCase().includes(termo) ||
        m.motivo_categoria?.toLowerCase().includes(termo) ||
        m.motivo_descricao?.toLowerCase().includes(termo);
      const bateStatus = !filtroStatus || m.status === filtroStatus;
      return bateTexto && bateStatus;
    });
  }, [ativas, filtroTexto, filtroStatus]);

  const exportarHistoricoCSV = () => {
    if (historico.length === 0) return;
    const cabecalho = ['Carro', 'Categoria', 'Descrição', 'Entrada', 'Saída', 'Duração', 'Observações Finais'];
    const linhas = historico.map((m) => [
      m.carros?.codigo || '—',
      m.motivo_categoria,
      m.motivo_descricao || '',
      new Date(m.entrada).toLocaleString(),
      m.saida ? new Date(m.saida).toLocaleString() : '—',
      m.saida ? formatarDuracao(new Date(m.saida).getTime() - new Date(m.entrada).getTime()) : '—',
      m.observacoes_finais || '',
    ]);
    const csv = [cabecalho, ...linhas].map((l) => l.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historico_manutencao.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-xl font-bold text-mro-azul">🔧 Carros em Manutenção</h1>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="bg-mro-azul text-white text-sm px-4 py-2 rounded hover:bg-mro-azul-claro"
        >
          {mostrarForm ? '✕ Cancelar' : '➕ Enviar para Manutenção'}
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-4">
          ⚠️ {erro}
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="font-semibold text-mro-azul mb-3">Enviar veículo para manutenção</h2>
          <div className="relative mb-3 max-w-md">
            <input
              value={buscaCarro}
              onChange={(e) => buscarSugestoes(e.target.value)}
              placeholder="Buscar carro pelo código..."
              className="w-full border rounded px-3 py-2 text-sm"
            />
            {sugestoes.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg">
                {sugestoes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { setCarroEscolhido(c); setBuscaCarro(c.codigo); setSugestoes([]); }}
                    className={`px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex justify-between ${c.em_manutencao ? 'text-gray-300' : ''}`}
                  >
                    <span>{c.codigo}</span>
                    {c.em_manutencao && <span className="text-xs">já em manutenção</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="block text-sm mb-1">Categoria do motivo</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full max-w-md border rounded px-3 py-2 mb-3 text-sm">
            <option value="">Selecione...</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="block text-sm mb-1">Descrição detalhada</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Veículo apresentou falha no sistema hidráulico durante movimentação."
            className="w-full max-w-md border rounded px-3 py-2 mb-3 text-sm"
            rows={3}
          />

          <button
            onClick={handleEnviar}
            disabled={enviando}
            className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : '🚧 Enviar para Manutenção'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold text-mro-azul mb-3">📊 Indicadores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-mro-azul">{indicadores.totalAtivas}</div>
            <div className="text-xs text-gray-500">Em manutenção</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-red-600">{indicadores.percentualIndisponivel}%</div>
            <div className="text-xs text-gray-500">Frota indisponível</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-mro-azul">{indicadores.tempoMedio}</div>
            <div className="text-xs text-gray-500">Tempo médio de manutenção</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-orange-500">{indicadores.aguardandoPecas}</div>
            <div className="text-xs text-gray-500">Aguardando peças</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-green-600">{indicadores.entradasHoje}</div>
            <div className="text-xs text-gray-500">Entradas hoje</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-green-600">{indicadores.saidasHoje}</div>
            <div className="text-xs text-gray-500">Saídas hoje</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-red-600">{indicadores.vencidas}</div>
            <div className="text-xs text-gray-500">Manutenção vencida (&gt;{LIMITE_DIAS_VENCIDA}d)</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3">
            <div className="text-xl font-bold text-mro-azul">{totalFrota}</div>
            <div className="text-xs text-gray-500">Total da frota</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {STATUS_FLUXO.map((s) => (
            <span key={s} className="bg-gray-100 rounded-full px-3 py-1">
              {STATUS_LABEL[s]}: <strong>{indicadores.porStatus[s] || 0}</strong>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">🔍 Buscar por carro, categoria ou motivo</label>
          <input value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">Todos</option>
            {STATUS_FLUXO.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {carregando ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : ativasFiltradas.length === 0 ? (
        <p className="text-gray-400 text-sm mb-6">Nenhum veículo em manutenção com esses filtros.</p>
      ) : (
        <div className="space-y-3 mb-8">
          {ativasFiltradas.map((m) => {
            const { dias, horas, minutos } = diffPartes(m.entrada);
            const alerta = alertaDoItem(m);
            return (
              <div key={m.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-mro-azul">{m.carros?.codigo}</h3>
                    <p className="text-xs text-gray-500">{m.motivo_categoria}{m.motivo_descricao ? ` — ${m.motivo_descricao}` : ''}</p>
                  </div>
                  {alerta && (
                    <span className="text-xs bg-gray-100 rounded-full px-3 py-1">{alerta.cor} {alerta.label}</span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  ⏱️ Em manutenção há: <strong>{dias}d {horas}h {minutos}min</strong>
                </p>

                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={m.status}
                    onChange={(e) => handleTrocarStatus(m.id, e.target.value)}
                    className="border rounded px-2 py-1.5 text-xs"
                  >
                    {STATUS_FLUXO.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setLiberando(m)}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                  >
                    ✅ Liberar Veículo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-mro-azul">📜 Histórico de Manutenções</h2>
          <div className="flex gap-2">
            <button onClick={() => setMostrarHistorico((v) => !v)} className="text-xs border rounded px-3 py-1.5 hover:bg-gray-50">
              {mostrarHistorico ? 'Ocultar' : 'Mostrar'}
            </button>
            <button onClick={exportarHistoricoCSV} className="text-xs border rounded px-3 py-1.5 hover:bg-gray-50">⬇️ Exportar CSV</button>
          </div>
        </div>
        {mostrarHistorico && (
          historico.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma manutenção finalizada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="p-2 whitespace-nowrap">Carro</th>
                    <th className="p-2 whitespace-nowrap">Motivo</th>
                    <th className="p-2 whitespace-nowrap">Entrada</th>
                    <th className="p-2 whitespace-nowrap">Saída</th>
                    <th className="p-2 whitespace-nowrap">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="p-2 whitespace-nowrap">{m.carros?.codigo}</td>
                      <td className="p-2 whitespace-nowrap">{m.motivo_categoria}</td>
                      <td className="p-2 whitespace-nowrap">{new Date(m.entrada).toLocaleString()}</td>
                      <td className="p-2 whitespace-nowrap">{m.saida ? new Date(m.saida).toLocaleString() : '—'}</td>
                      <td className="p-2 whitespace-nowrap">{m.saida ? formatarDuracao(new Date(m.saida).getTime() - new Date(m.entrada).getTime()) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {liberando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow p-5 max-w-md w-full">
            <h3 className="font-bold text-mro-azul mb-3">✅ Liberar {liberando.carros?.codigo}</h3>
            <label className="block text-sm mb-1">Observações finais</label>
            <textarea
              value={obsFinais}
              onChange={(e) => setObsFinais(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={handleLiberar} className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700">
                Confirmar Liberação
              </button>
              <button onClick={() => { setLiberando(null); setObsFinais(''); }} className="flex-1 border py-2 rounded text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};