import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mapa2D } from '../components/Mapa2D';

// Ordem física real das ruas de cada galpão (a mesma sequência dos arquivos de configuração)
const ORDEM_RUAS: Record<string, string[]> = {
  A: ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
  B: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q'],
  D: [
    'AL', 'AJ', 'AI', 'AH', 'AG', 'AF', 'AE', 'AD', 'AC', 'AB', 'AA',
    'Z', 'X', 'V', 'U', 'T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  ],
};

export const Mapa2DPage = () => {
  const { galpaoId } = useParams();
  const [vagas, setVagas] = useState<any[]>([]);

  useEffect(() => {
    if (!galpaoId) return;
    supabase.from('vagas').select('*').eq('galpao_id', galpaoId).then(({ data }) => setVagas(data || []));
  }, [galpaoId]);

  const ordemRuas = ORDEM_RUAS[galpaoId || ''] || [];

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-mro-azul mb-4">Galpão {galpaoId} — Mapa 2D</h1>
      <Mapa2D vagas={vagas} ordemRuas={ordemRuas} onVagaClick={(id) => console.log('vaga clicada', id)} />
    </div>
  );
};