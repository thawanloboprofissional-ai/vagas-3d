import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlobalSearch } from '../components/GlobalSearch';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Card = ({ titulo, valor, sub }: { titulo: string; valor: number | string; sub?: string }) => (
  <div className="bg-white rounded-xl shadow p-4 text-center">
    <div className="text-2xl font-bold text-mro-azul">{valor}</div>
    <div className="text-sm text-gray-500">{titulo}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
);

interface GalpaoResumo {
  id: string;
  nome: string;
  total: number;
  ocupadas: number;
}

export const InicioPage = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [erroMetrics, setErroMetrics] = useState<string | null>(null);
  const [movimentadosHoje, setMovimentadosHoje] = useState<number | null>(null);
  const [galpoesResumo, setGalpoesResumo] = useState<GalpaoResumo[]>([]);

  useEffect(() => {
    // Métricas gerais (ocupação por rua + ranking de operadores)
    supabase.rpc('get_dashboard_metrics', { p_dias: 7 }).then(({ data, error }) => {
      if (error) {
        setErroMetrics(error.message);
        return;
      }
      setMetrics(data);
    });

    // Carros movimentados hoje (desde a meia-noite local)
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);
    supabase
      .from('movimentacoes')
      .select('carro_id', { count: 'exact', head: false })
      .gte('timestamp', inicioDoDia.toISOString())
      .then(({ data }) => {
        const idsUnicos = new Set((data || []).map((m: any) => m.carro_id));
        setMovimentadosHoje(idsUnicos.size);
      });

    // Ocupação por galpão
    Promise.all([
      supabase.from('galpoes').select('id, nome').order('id'),
      supabase.from('vagas').select('galpao_id, status'),
    ]).then(([galpoesRes, vagasRes]) => {
      const galpoes = galpoesRes.data || [];
      const vagas = vagasRes.data || [];
      const resumo: GalpaoResumo[] = galpoes.map((g: any) => {
        const vagasDoGalpao = vagas.filter((v: any) => v.galpao_id === g.id);
        const ocupadas = vagasDoGalpao.filter((v: any) => v.status === 'ocupado').length;
        return { id: g.id, nome: g.nome, total: vagasDoGalpao.length, ocupadas };
      });
      setGalpoesResumo(resumo);
    });
  }, []);

  const ocupacao = metrics?.ocupacao_por_rua || [];
  const ranking = metrics?.ranking_operadores || [];
  const totalVagas = ocupacao.reduce((acc: number, r: any) => acc + r.total, 0);
  const totalOcupadas = ocupacao.reduce((acc: number, r: any) => acc + r.ocupadas, 0);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-mro-azul mb-4">🏠 Painel Geral</h1>
        <GlobalSearch />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-mro-azul mb-3">🚗 Movimentação de hoje</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            titulo="Carros movimentados hoje"
            valor={movimentadosHoje === null ? '...' : movimentadosHoje}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-mro-azul mb-3">🏭 Ocupação por Galpão</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {galpoesResumo.length === 0 ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : (
            galpoesResumo.map((g) => {
              const percOcupado = g.total ? Math.round((g.ocupadas / g.total) * 100) : 0;
              const percLivre = 100 - percOcupado;
              return (
                <Link
                  key={g.id}
                  to={`/mapa2d/${g.id}`}
                  className="bg-white rounded-xl shadow p-4 block hover:shadow-md hover:ring-2 hover:ring-mro-azul-claro transition"
                >
                  <h3 className="font-semibold text-mro-azul mb-2">{g.nome}</h3>
                  <div className="w-full h-3 rounded-full bg-green-200 overflow-hidden mb-2">
                    <div className="h-full bg-red-500" style={{ width: `${percOcupado}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>🔴 Ocupado: {percOcupado}%</span>
                    <span>🟢 Livre: {percLivre}%</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{g.ocupadas} de {g.total} vagas ocupadas</div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-mro-azul mb-3">📊 Métricas Gerais</h2>
        {erroMetrics && <p className="text-red-600 text-sm mb-2">{erroMetrics}</p>}
        {metrics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card titulo="Vagas Total" valor={totalVagas} />
              <Card titulo="Ocupadas" valor={totalOcupadas} sub={`${totalVagas ? Math.round((totalOcupadas / totalVagas) * 100) : 0}%`} />
              <Card titulo="Livres" valor={totalVagas - totalOcupadas} />
              <Card titulo="Ruas monitoradas" valor={ocupacao.length} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-semibold mb-4">📈 Ocupação por Rua</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ocupacao}>
                    <XAxis dataKey="rua" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentual" fill="#0B2545" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow p-4">
                <h3 className="font-semibold mb-4">🏆 Ranking de Operadores</h3>
                {ranking.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma movimentação recente.</p>
                ) : (
                  <ul>
                    {ranking.map((r: any, i: number) => (
                      <li key={i} className="flex justify-between py-2 border-b text-sm">
                        <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {r.operador}</span>
                        <span>{r.total} movimentações</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};