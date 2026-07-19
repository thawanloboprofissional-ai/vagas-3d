import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardPage = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.rpc('get_dashboard_metrics', { p_dias: 7 }).then(({ data, error }) => {
      setCarregando(false);
      if (error) {
        console.error('Erro ao buscar métricas:', error);
        setErro(error.message);
        return;
      }
      setMetrics(data);
    });
  }, []);

  if (carregando) return <div className="p-6">Carregando métricas...</div>;

  if (erro) {
    return (
      <div className="p-6">
        <p className="text-red-600 font-semibold">Erro ao carregar métricas:</p>
        <p className="text-red-600">{erro}</p>
      </div>
    );
  }

  if (!metrics) return <div className="p-6">Nenhuma métrica retornada.</div>;

  const ocupacao = metrics.ocupacao_por_rua || [];
  const ranking = metrics.ranking_operadores || [];

  const totalVagas = ocupacao.reduce((acc: number, r: any) => acc + r.total, 0);
  const totalOcupadas = ocupacao.reduce((acc: number, r: any) => acc + r.ocupadas, 0);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-mro-azul mb-6">📊 Painel de Controle</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card titulo="Vagas Total" valor={totalVagas} />
        <Card titulo="Ocupadas" valor={totalOcupadas} sub={`${totalVagas ? Math.round((totalOcupadas / totalVagas) * 100) : 0}%`} />
        <Card titulo="Livres" valor={totalVagas - totalOcupadas} />
        <Card titulo="Ruas monitoradas" valor={ocupacao.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-4">📈 Ocupação por Rua</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ocupacao}>
              <XAxis dataKey="rua" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentual" fill="#0B2545" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-4">🏆 Ranking de Operadores</h2>
          <ul>
            {ranking.map((r: any, i: number) => (
              <li key={i} className="flex justify-between py-2 border-b text-sm">
                <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {r.operador}</span>
                <span>{r.total} movimentações</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const Card = ({ titulo, valor, sub }: { titulo: string; valor: number; sub?: string }) => (
  <div className="bg-white rounded-xl shadow p-4 text-center">
    <div className="text-2xl font-bold text-mro-azul">{valor}</div>
    <div className="text-sm text-gray-500">{titulo}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
);