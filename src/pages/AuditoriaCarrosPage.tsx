import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type FiltroPeriodo = 'hoje' | '7dias' | '30dias' | 'mes_atual' | 'mes_anterior' | 'personalizado';
type FiltroFrota = 'total' | 'em_vaga' | 'em_local_externo' | 'sem_vaga' | 'inativo' | null;

interface CarroBusca {
  id: string;
  codigo: string;
}

interface TimelineItem {
  id: string;
  timestamp: string;
  tipo_evento: string;
  origem: string;
  destino: string;
  operador_nome: string | null;
}

interface CarroFrota {
  id: string;
  codigo: string;
  status: string;
  ultima_atualizacao: string | null;
  vaga_codigo: string | null;
  galpao_id: string | null;
  local_externo_nome: string | null;
}

interface ResumoFrota {
  total: number;
  emVaga: number;
  emLocalExterno: number;
  semVaga: number;
  inativo: number;
  alertaAmarelo: number;
  alertaVermelho: number;
}

function calcularIntervalo(filtro: FiltroPeriodo, dataInicioManual: string, dataFimManual: string) {
  const agora = new Date();
  let inicio: Date;
  let fim: Date = new Date(agora);

  if (filtro === 'hoje') {
    inicio = new Date(agora);
    inicio.setHours(0, 0, 0, 0);
  } else if (filtro === '7dias') {
    inicio = new Date(agora);
    inicio.setDate(inicio.getDate() - 7);
  } else if (filtro === '30dias') {
    inicio = new Date(agora);
    inicio.setDate(inicio.getDate() - 30);
  } else if (filtro === 'mes_atual') {
    inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
  } else if (filtro === 'mes_anterior') {
    inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    fim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);
  } else {
    inicio = dataInicioManual ? new Date(dataInicioManual + 'T00:00:00') : new Date(0);
    fim = dataFimManual ? new Date(dataFimManual + 'T23:59:59') : agora;
  }
  return { inicio, fim };
}

function formatarDuracao(ms: number) {
  const minutos = Math.floor(ms / 60000);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas}h ${minutos % 60}min`;
  const dias = Math.floor(horas / 24);
  return `${dias}d ${horas % 24}h`;
}

const LIMITE_AMARELO_HORAS = 24;
const LIMITE_VERMELHO_HORAS = 72;

export const AuditoriaCarrosPage = () => {
  const [termoBusca, setTermoBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<CarroBusca[]>([]);
  const [carroSelecionado, setCarroSelecionado] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [filtro, setFiltro] = useState<FiltroPeriodo>('30dias');
  const [dataInicioManual, setDataInicioManual] = useState('');
  const [dataFimManual, setDataFimManual] = useState('');

  const [carrosFrota, setCarrosFrota] = useState<CarroFrota[]>([]);
  const [resumoFrota, setResumoFrota] = useState<ResumoFrota | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [filtroFrota, setFiltroFrota] = useState<FiltroFrota>(null);

  // Carrega a visão geral da frota assim que a página abre (independe de busca)
  useEffect(() => {
    supabase
      .from('carros')
      .select('id, codigo, status, ultima_atualizacao, vagas:vaga_atual_id(codigo, galpao_id), locais_externos:local_externo_id(nome)')
      .then(({ data, error }) => {
        setCarregandoResumo(false);
        if (error || !data) return;

        const agora = Date.now();
        let emVaga = 0, emLocalExterno = 0, semVaga = 0, inativo = 0, alertaAmarelo = 0, alertaVermelho = 0;

        const lista: CarroFrota[] = data.map((c: any) => {
          if (c.status === 'em_vaga') emVaga++;
          else if (c.status === 'em_local_externo') emLocalExterno++;
          else if (c.status === 'sem_vaga') semVaga++;
          else if (c.status === 'inativo') inativo++;

          if (c.ultima_atualizacao) {
            const horas = (agora - new Date(c.ultima_atualizacao).getTime()) / 3600000;
            if (horas > LIMITE_VERMELHO_HORAS) alertaVermelho++;
            else if (horas > LIMITE_AMARELO_HORAS) alertaAmarelo++;
          }

          return {
            id: c.id,
            codigo: c.codigo,
            status: c.status,
            ultima_atualizacao: c.ultima_atualizacao,
            vaga_codigo: c.vagas?.codigo || null,
            galpao_id: c.vagas?.galpao_id || null,
            local_externo_nome: c.locais_externos?.nome || null,
          };
        });

        setCarrosFrota(lista);
        setResumoFrota({
          total: data.length,
          emVaga,
          emLocalExterno,
          semVaga,
          inativo,
          alertaAmarelo,
          alertaVermelho,
        });
      });
  }, []);

  const carrosFiltrados = useMemo(() => {
    if (!filtroFrota) return [];
    if (filtroFrota === 'total') return carrosFrota;
    return carrosFrota.filter((c) => c.status === filtroFrota);
  }, [carrosFrota, filtroFrota]);

  const alternarFiltroFrota = (f: FiltroFrota) => {
    setFiltroFrota((atual) => (atual === f ? null : f));
  };

  const localDoCarroFrota = (c: CarroFrota) => {
    if (c.local_externo_nome) return `📍 ${c.local_externo_nome}`;
    if (c.vaga_codigo) return `🅿️ ${c.vaga_codigo} (Galpão ${c.galpao_id})`;
    return 'Sem localização';
  };

  const buscarSugestoes = async (termo: string) => {
    setTermoBusca(termo);
    if (termo.length < 2) {
      setSugestoes([]);
      return;
    }
    const { data } = await supabase
      .from('carros')
      .select('id, codigo')
      .ilike('codigo', `%${termo}%`)
      .limit(8);
    setSugestoes(data || []);
  };

  const carregarCarro = async (carroId: string, filtroAtual: FiltroPeriodo = filtro) => {
    setCarregando(true);
    setErro('');
    setSugestoes([]);

    const { data: carro, error: erroCarro } = await supabase
      .from('carros')
      .select('*, vagas:vaga_atual_id(codigo, galpao_id, rua), locais_externos:local_externo_id(nome), operadores:ultima_atualizacao_por(nome)')
      .eq('id', carroId)
      .single();

    if (erroCarro || !carro) {
      setErro('Não foi possível carregar o carro.');
      setCarregando(false);
      return;
    }
    setCarroSelecionado(carro);
    setTermoBusca(carro.codigo);

    const { inicio, fim } = calcularIntervalo(filtroAtual, dataInicioManual, dataFimManual);
    const { data: linha, error: erroTimeline } = await supabase.rpc('obter_timeline_carro', {
      p_carro_id: carroId,
      p_data_inicio: inicio.toISOString(),
      p_data_fim: fim.toISOString(),
    });

    if (erroTimeline) {
      setErro('Erro ao carregar histórico: ' + erroTimeline.message);
    } else {
      setTimeline(linha || []);
    }
    setCarregando(false);
  };

  const selecionarDaLista = (carroId: string) => {
    carregarCarro(carroId);
    // rola suavemente até o resumo do carro depois de carregar
    setTimeout(() => {
      document.getElementById('resumo-veiculo')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const trocarFiltro = (novoFiltro: FiltroPeriodo) => {
    setFiltro(novoFiltro);
    if (carroSelecionado) carregarCarro(carroSelecionado.id, novoFiltro);
  };

  const aplicarPeriodoPersonalizado = () => {
    if (carroSelecionado) carregarCarro(carroSelecionado.id, 'personalizado');
  };

  // ===== KPIs calculados a partir da timeline =====
  const kpis = useMemo(() => {
    if (timeline.length === 0) {
      return { total: 0, mediaDiaria: 0, ultimaMovStr: '—', localMaisTempo: '—', tempoMedioPermanencia: '—', locaisDiferentes: 0 };
    }
    const total = timeline.length;
    const { inicio, fim } = calcularIntervalo(filtro, dataInicioManual, dataFimManual);
    const dias = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 86400000));
    const mediaDiaria = Math.round((total / dias) * 10) / 10;
    const ultimaMovStr = new Date(timeline[0].timestamp).toLocaleString();

    const ordenada = [...timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const permanencias: { local: string; ms: number }[] = [];
    for (let i = 0; i < ordenada.length - 1; i++) {
      const ms = new Date(ordenada[i + 1].timestamp).getTime() - new Date(ordenada[i].timestamp).getTime();
      permanencias.push({ local: ordenada[i].destino, ms });
    }
    const tempoMedioMs = permanencias.length
      ? permanencias.reduce((acc, p) => acc + p.ms, 0) / permanencias.length
      : 0;
    const maiorPermanencia = permanencias.reduce(
      (max, p) => (p.ms > max.ms ? p : max),
      { local: '—', ms: 0 }
    );

    const locaisSet = new Set(timeline.map((t) => t.destino));
    return {
      total,
      mediaDiaria,
      ultimaMovStr,
      localMaisTempo: maiorPermanencia.local !== '—' ? `${maiorPermanencia.local} (${formatarDuracao(maiorPermanencia.ms)})` : '—',
      tempoMedioPermanencia: tempoMedioMs ? formatarDuracao(tempoMedioMs) : '—',
      locaisDiferentes: locaisSet.size,
    };
  }, [timeline, filtro, dataInicioManual, dataFimManual]);

  // ===== Status atual + alerta =====
  const statusAtual = useMemo(() => {
    if (!carroSelecionado) return null;
    const localAtual = carroSelecionado.locais_externos?.nome
      || (carroSelecionado.vagas ? `${carroSelecionado.vagas.codigo} (Galpão ${carroSelecionado.vagas.galpao_id})` : 'Sem localização');
    const ultimaAtualizacao = new Date(carroSelecionado.ultima_atualizacao);
    const horasParado = (Date.now() - ultimaAtualizacao.getTime()) / 3600000;
    let alerta: { cor: string; label: string } = { cor: '🟢', label: 'Atualizado recentemente' };
    if (horasParado > LIMITE_VERMELHO_HORAS) alerta = { cor: '🔴', label: `Parado há mais de ${LIMITE_VERMELHO_HORAS}h` };
    else if (horasParado > LIMITE_AMARELO_HORAS) alerta = { cor: '🟡', label: `Sem atualização há mais de ${LIMITE_AMARELO_HORAS}h` };

    return {
      localAtual,
      ultimaAtualizacao,
      operador: carroSelecionado.operadores?.nome || '—',
      tempoNaLocalizacao: formatarDuracao(Date.now() - ultimaAtualizacao.getTime()),
      alerta,
    };
  }, [carroSelecionado]);

  const exportarCSV = () => {
    if (timeline.length === 0) return;
    const cabecalho = ['Data/Hora', 'Tipo', 'Origem', 'Destino', 'Operador'];
    const linhas = timeline.map((t) => [
      new Date(t.timestamp).toLocaleString(),
      t.tipo_evento,
      t.origem,
      t.destino,
      t.operador_nome || '—',
    ]);
    const csv = [cabecalho, ...linhas].map((l) => l.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${carroSelecionado?.codigo || 'carro'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardClasses = (ativo: boolean) =>
    `text-center rounded-lg py-3 transition cursor-pointer ${
      ativo ? 'bg-mro-azul text-white ring-2 ring-mro-azul-claro' : 'bg-gray-50 hover:bg-gray-100'
    }`;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-mro-azul mb-4">🔎 Auditoria de Carros</h1>

      {/* Visão geral da frota */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="font-semibold text-mro-azul mb-3">📦 Visão Geral da Frota</h2>
        {carregandoResumo ? (
          <p className="text-sm text-gray-400">Carregando resumo...</p>
        ) : !resumoFrota ? (
          <p className="text-sm text-red-500">Não foi possível carregar o resumo.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              <button onClick={() => alternarFiltroFrota('total')} className={cardClasses(filtroFrota === 'total')}>
                <div className={`text-xl font-bold ${filtroFrota === 'total' ? 'text-white' : 'text-mro-azul'}`}>{resumoFrota.total}</div>
                <div className={`text-xs ${filtroFrota === 'total' ? 'text-gray-100' : 'text-gray-500'}`}>Total de carros</div>
              </button>
              <button onClick={() => alternarFiltroFrota('em_vaga')} className={cardClasses(filtroFrota === 'em_vaga')}>
                <div className={`text-xl font-bold ${filtroFrota === 'em_vaga' ? 'text-white' : 'text-green-600'}`}>{resumoFrota.emVaga}</div>
                <div className={`text-xs ${filtroFrota === 'em_vaga' ? 'text-gray-100' : 'text-gray-500'}`}>Em vaga</div>
              </button>
              <button onClick={() => alternarFiltroFrota('em_local_externo')} className={cardClasses(filtroFrota === 'em_local_externo')}>
                <div className={`text-xl font-bold ${filtroFrota === 'em_local_externo' ? 'text-white' : 'text-purple-600'}`}>{resumoFrota.emLocalExterno}</div>
                <div className={`text-xs ${filtroFrota === 'em_local_externo' ? 'text-gray-100' : 'text-gray-500'}`}>Em local externo</div>
              </button>
              <button onClick={() => alternarFiltroFrota('sem_vaga')} className={cardClasses(filtroFrota === 'sem_vaga')}>
                <div className={`text-xl font-bold ${filtroFrota === 'sem_vaga' ? 'text-white' : 'text-yellow-600'}`}>{resumoFrota.semVaga}</div>
                <div className={`text-xs ${filtroFrota === 'sem_vaga' ? 'text-gray-100' : 'text-gray-500'}`}>Sem localização</div>
              </button>
              <button onClick={() => alternarFiltroFrota('inativo')} className={cardClasses(filtroFrota === 'inativo')}>
                <div className={`text-xl font-bold ${filtroFrota === 'inativo' ? 'text-white' : 'text-gray-400'}`}>{resumoFrota.inativo}</div>
                <div className={`text-xs ${filtroFrota === 'inativo' ? 'text-gray-100' : 'text-gray-500'}`}>Inativos</div>
              </button>
            </div>

            {(resumoFrota.alertaAmarelo > 0 || resumoFrota.alertaVermelho > 0) && (
              <div className="flex flex-wrap gap-3 text-xs mb-3">
                {resumoFrota.alertaVermelho > 0 && (
                  <span className="bg-red-50 text-red-700 rounded-full px-3 py-1">
                    🔴 {resumoFrota.alertaVermelho} carro(s) parado(s) há mais de {LIMITE_VERMELHO_HORAS}h
                  </span>
                )}
                {resumoFrota.alertaAmarelo > 0 && (
                  <span className="bg-yellow-50 text-yellow-700 rounded-full px-3 py-1">
                    🟡 {resumoFrota.alertaAmarelo} carro(s) sem atualização há mais de {LIMITE_AMARELO_HORAS}h
                  </span>
                )}
              </div>
            )}

            {/* Lista de carros do filtro selecionado */}
            {filtroFrota && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-400 mb-2">{carrosFiltrados.length} carro(s) — clique para ver detalhes</p>
                {carrosFiltrados.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhum carro nessa categoria.</p>
                ) : (
                  <ul className="divide-y max-h-72 overflow-y-auto">
                    {carrosFiltrados.map((c) => (
                      <li
                        key={c.id}
                        onClick={() => selecionarDaLista(c.id)}
                        className="flex justify-between items-center py-2 px-1 text-sm hover:bg-gray-50 cursor-pointer rounded"
                      >
                        <div>
                          <span className="font-medium">{c.codigo}</span>
                          <span className="text-gray-400 text-xs ml-2">{localDoCarroFrota(c)}</span>
                        </div>
                        <span className="text-mro-azul text-xs">Ver detalhes →</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Busca */}
      <div className="relative max-w-md mb-6">
        <input
          value={termoBusca}
          onChange={(e) => buscarSugestoes(e.target.value)}
          placeholder="Buscar por código do carro..."
          className="w-full border rounded px-3 py-2 text-sm"
        />
        {sugestoes.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg">
            {sugestoes.map((c) => (
              <div
                key={c.id}
                onClick={() => carregarCarro(c.id)}
                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                {c.codigo}
              </div>
            ))}
          </div>
        )}
      </div>

      {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}
      {carregando && <p className="text-gray-400 text-sm mb-4">Carregando...</p>}

      {carroSelecionado && statusAtual && (
        <>
          {/* Resumo do veículo */}
          <div id="resumo-veiculo" className="bg-white rounded-xl shadow p-4 mb-6 scroll-mt-4">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
              <div>
                <h2 className="text-lg font-bold text-mro-azul">{carroSelecionado.codigo}</h2>
                <p className="text-sm text-gray-500">{carroSelecionado.descricao || 'Sem descrição'}</p>
              </div>
              <span className="text-sm bg-gray-100 rounded-full px-3 py-1">
                {statusAtual.alerta.cor} {statusAtual.alerta.label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs">Localização atual</p><p className="font-medium">{statusAtual.localAtual}</p></div>
              <div><p className="text-gray-400 text-xs">Última atualização</p><p className="font-medium">{statusAtual.ultimaAtualizacao.toLocaleString()}</p></div>
              <div><p className="text-gray-400 text-xs">Responsável</p><p className="font-medium">{statusAtual.operador}</p></div>
              <div><p className="text-gray-400 text-xs">Tempo na localização</p><p className="font-medium">{statusAtual.tempoNaLocalizacao}</p></div>
            </div>
          </div>

          {/* Filtros de período */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-2 items-end">
            {(['hoje', '7dias', '30dias', 'mes_atual', 'mes_anterior', 'personalizado'] as FiltroPeriodo[]).map((f) => (
              <button
                key={f}
                onClick={() => trocarFiltro(f)}
                className={`text-xs px-3 py-2 rounded border ${filtro === f ? 'bg-mro-azul text-white border-mro-azul' : 'text-gray-600'}`}
              >
                {{
                  hoje: 'Hoje',
                  '7dias': 'Últimos 7 dias',
                  '30dias': 'Últimos 30 dias',
                  mes_atual: 'Mês atual',
                  mes_anterior: 'Mês anterior',
                  personalizado: 'Personalizado',
                }[f]}
              </button>
            ))}
            {filtro === 'personalizado' && (
              <>
                <input type="date" value={dataInicioManual} onChange={(e) => setDataInicioManual(e.target.value)} className="border rounded px-2 py-2 text-xs" />
                <input type="date" value={dataFimManual} onChange={(e) => setDataFimManual(e.target.value)} className="border rounded px-2 py-2 text-xs" />
                <button onClick={aplicarPeriodoPersonalizado} className="text-xs bg-mro-azul text-white px-3 py-2 rounded">Aplicar</button>
              </>
            )}
            <button onClick={exportarCSV} className="text-xs border rounded px-3 py-2 ml-auto hover:bg-gray-50">⬇️ Exportar CSV</button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-xl font-bold text-mro-azul">{kpis.total}</div>
              <div className="text-xs text-gray-500">Movimentações no período</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-xl font-bold text-mro-azul">{kpis.mediaDiaria}</div>
              <div className="text-xs text-gray-500">Média diária</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-sm font-bold text-mro-azul">{kpis.ultimaMovStr}</div>
              <div className="text-xs text-gray-500">Última movimentação</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-sm font-bold text-mro-azul">{kpis.tempoMedioPermanencia}</div>
              <div className="text-xs text-gray-500">Tempo médio de permanência</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-sm font-bold text-mro-azul">{kpis.localMaisTempo}</div>
              <div className="text-xs text-gray-500">Local com maior permanência</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-xl font-bold text-mro-azul">{kpis.locaisDiferentes}</div>
              <div className="text-xs text-gray-500">Locais diferentes visitados</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-4">🕒 Histórico de Movimentações</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma movimentação neste período.</p>
            ) : (
              <ul className="space-y-3">
                {timeline.map((t) => (
                  <li key={t.id} className="border-l-2 border-mro-azul pl-3 text-sm">
                    <p className="text-gray-400 text-xs">{new Date(t.timestamp).toLocaleString()}</p>
                    <p>
                      <span className="font-medium">{t.origem}</span> → <span className="font-medium">{t.destino}</span>
                      <span className="text-gray-400"> · {t.tipo_evento}</span>
                    </p>
                    <p className="text-gray-500 text-xs">Responsável: {t.operador_nome || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};