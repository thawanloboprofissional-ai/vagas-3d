import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const GalpoesPage = () => {
  const [galpoes, setGalpoes] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('galpoes').select('*').order('id').then(({ data }) => setGalpoes(data || []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-mro-azul mb-6">🏭 Galpões</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {galpoes.map((g) => (
          <div key={g.id} className="bg-white rounded-xl shadow p-5">
            <h2 className="font-semibold text-lg text-mro-azul">{g.nome}</h2>
            <p className="text-sm text-gray-500 mb-4">{g.total_vagas} vagas totais</p>
            <Link
              to={`/mapa2d/${g.id}`}
              className="inline-block bg-mro-azul text-white text-sm px-4 py-2 rounded hover:bg-mro-azul-claro"
            >
              🗺️ Ver Mapa 2D
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};