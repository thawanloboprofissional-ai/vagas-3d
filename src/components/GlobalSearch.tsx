import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  carro_id: string;
  codigo: string;
  galpao_id: string;
  galpao_nome: string;
  rua: string;
  vaga_id: string;
  vaga_codigo: string;
  status: string;
  tipo_especial: string | null;
  ultima_atualizacao: string;
  ultima_atualizacao_por: string;
}

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useKeyboardShortcut('k', () => inputRef.current?.focus());

  const handleSearch = async (termo: string) => {
    setQuery(termo);
    if (termo.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('buscar_carros_global', { p_search: termo });
    setLoading(false);
    if (!error) {
      setResults(data || []);
      setOpen(true);
    }
  };

  const corStatus = (status: string, especial: string | null) => {
    if (especial) return 'bg-red-600';
    if (status === 'em_vaga') return 'bg-green-600';
    if (status === 'sem_vaga') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="relative max-w-xl mx-auto">
      <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm">
        <span className="mr-2">🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar carro C1, vaga ou rua..."
          className="flex-1 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}>❌</button>
        )}
        <kbd className="ml-2 text-xs text-gray-400 border rounded px-1">Ctrl+K</kbd>
      </div>

      {open && (
        <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-400">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">Nenhum resultado encontrado.</div>
          ) : (
            results.map((r) => (
              <div key={r.carro_id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <strong>{r.codigo}</strong>
                    <span className={`text-white text-xs px-2 py-0.5 rounded ${corStatus(r.status, r.tipo_especial)}`}>
                      {r.tipo_especial || r.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    📍 {r.galpao_nome} · Rua {r.rua} · Vaga {r.vaga_codigo}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/carro/${r.carro_id}/editar`)} title="Editar">✏️</button>
                  <button onClick={() => navigate(`/transferir/${r.carro_id}`)} title="Transferir">🔄</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};