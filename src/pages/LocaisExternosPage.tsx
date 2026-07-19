import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const LocaisExternosPage = () => {
  const [locais, setLocais] = useState<any[]>([]);
  const [carrosPorLocal, setCarrosPorLocal] = useState<Record<string, any[]>>({});

  const carregar = useCallback(() => {
    supabase.from('locais_externos').select('*').order('nome').then(({ data }) => setLocais(data || []));
    supabase
      .from('carros')
      .select('id, codigo, local_externo_id, ultima_atualizacao')
      .not('local_externo_id', 'is', null)
      .then(({ data }) => {
        const agrupado: Record<string, any[]> = {};
        (data || []).forEach((c: any) => {
          if (!agrupado[c.local_externo_id]) agrupado[c.local_externo_id] = [];
          agrupado[c.local_externo_id].push(c);
        });
        setCarrosPorLocal(agrupado);
      });
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-mro-azul mb-6">📍 Locais Externos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locais.map((l) => {
          const carros = carrosPorLocal[l.id] || [];
          return (
            <div key={l.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-mro-azul">{l.nome}</h2>
                <span className="text-xs bg-mro-azul text-white rounded-full px-2 py-0.5">{carros.length} carro(s)</span>
              </div>
              {carros.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhum carro neste local.</p>
              ) : (
                <ul className="text-sm divide-y">
                  {carros.map((c) => (
                    <li key={c.id} className="flex justify-between items-center py-2">
                      <span className="font-medium">{c.codigo}</span>
                      <Link to={`/transferir/${c.id}`} className="text-mro-azul text-xs hover:underline">
                        🔄 Mover
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};