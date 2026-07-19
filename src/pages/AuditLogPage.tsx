import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*, operadores(nome)')
      .order('timestamp', { ascending: false })
      .limit(500)
      .then(({ data }) => setLogs(data || []));
  }, []);

  const logsFiltrados = useMemo(() => {
    return logs.filter((l) => {
      const nomeOperador = (l.operadores?.nome || '').toLowerCase();
      const acao = (l.acao || '').toLowerCase();
      const tabela = (l.tabela || '').toLowerCase();
      const termo = busca.trim().toLowerCase();

      const bateBusca =
        termo === '' ||
        nomeOperador.includes(termo) ||
        acao.includes(termo) ||
        tabela.includes(termo);

      const dataLog = new Date(l.timestamp);

      const bateInicio = !dataInicio || dataLog >= new Date(dataInicio + 'T00:00:00');
      const bateFim = !dataFim || dataLog <= new Date(dataFim + 'T23:59:59');

      return bateBusca && bateInicio && bateFim;
    });
  }, [logs, busca, dataInicio, dataFim]);

  const limparFiltros = () => {
    setBusca('');
    setDataInicio('');
    setDataFim('');
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-mro-azul mb-4">🛡️ Audit Log</h1>

      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">🔍 Buscar por operador, ação ou tabela</label>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ex: Thawan, transferencia_carro..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full md:w-auto"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Até</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full md:w-auto"
          />
        </div>
        <button
          onClick={limparFiltros}
          className="text-sm border rounded px-3 py-2 text-gray-500 hover:bg-gray-50"
        >
          ✕ Limpar
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {logsFiltrados.length} de {logs.length} registros
      </p>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="p-2 whitespace-nowrap">Quando</th>
              <th className="p-2 whitespace-nowrap">Operador</th>
              <th className="p-2 whitespace-nowrap">Ação</th>
              <th className="p-2 whitespace-nowrap">Tabela</th>
            </tr>
          </thead>
          <tbody>
            {logsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  Nenhum registro encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              logsFiltrados.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-2 whitespace-nowrap">{l.operadores?.nome || '—'}</td>
                  <td className="p-2 whitespace-nowrap">{l.acao}</td>
                  <td className="p-2 whitespace-nowrap">{l.tabela}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};