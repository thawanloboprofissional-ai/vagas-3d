import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mapa2D } from '../components/Mapa2D';

export const Mapa2DPage = () => {
  const { galpaoId } = useParams();
  const [vagas, setVagas] = useState<any[]>([]);

  useEffect(() => {
    if (!galpaoId) return;
    supabase.from('vagas').select('*').eq('galpao_id', galpaoId).then(({ data }) => setVagas(data || []));
  }, [galpaoId]);

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-mro-azul mb-4">Galpão {galpaoId} — Mapa 2D</h1>
      <Mapa2D vagas={vagas} onVagaClick={(id) => console.log('vaga clicada', id)} />
    </div>
  );
};