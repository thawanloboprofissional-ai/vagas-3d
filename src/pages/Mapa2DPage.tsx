import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapaGrade } from '../components/MapaGrade';
import { MapaBlocos } from '../components/MapaBlocos';
import { layoutGalpaoA, layoutGalpaoB, layoutGalpaoD, layoutMG3_1Piso } from '../config/layoutsGalpoes';

const layoutsLinha: Record<string, any> = {
  A: layoutGalpaoA,
  B: layoutGalpaoB,
  D: layoutGalpaoD,
};

const layoutsBlocos: Record<string, any> = {
  MG3_1PISO: layoutMG3_1Piso,
};

export const Mapa2DPage = () => {
  const { galpaoId } = useParams();
  const [vagas, setVagas] = useState<any[]>([]);
  const [erro, setErro] = useState('');

  const carregarVagas = useCallback(() => {
    if (!galpaoId) return;
    supabase
      .from('vagas')
      .select('*, carros!vagas_carro_id_fkey(codigo)')
      .eq('galpao_id', galpaoId)
      .then(({ data, error }) => {
        if (error) {
          setErro('Erro ao carregar vagas: ' + error.message);
          return;
        }
        setVagas((data || []).map((v: any) => ({ ...v, carro_codigo: v.carros?.codigo || null })));
      });
  }, [galpaoId]);

  useEffect(() => {
    carregarVagas();
  }, [carregarVagas]);

  const handleMoverCarro = async (carroId: string, _origem: string, destino: string) => {
    setErro('');
    const { error } = await supabase.rpc('transferir_carro_entre_galpoes', {
      p_carro_id: carroId,
      p_vaga_destino_id: destino,
      p_motivo: 'Movido pelo mapa',
    });
    if (error) {
      setErro('Erro ao mover carro: ' + error.message);
      return;
    }
    carregarVagas();
  };

  const linhas = galpaoId ? layoutsLinha[galpaoId] : null;
  const blocos = galpaoId ? layoutsBlocos[galpaoId] : null;

  return (
    <div className="p-6">
      <Link to="/galpoes" className="text-sm text-mro-azul mb-4 inline-block">← Voltar para Galpões</Link>
      <h1 className="text-lg font-bold text-mro-azul mb-4">Galpão {galpaoId} — Mapa de Vagas</h1>
      {erro && <p className="text-red-600 text-sm mb-3">{erro}</p>}
      {linhas ? (
        <MapaGrade linhas={linhas} vagas={vagas} onMoverCarro={handleMoverCarro} />
      ) : blocos ? (
        <MapaBlocos layout={blocos} vagas={vagas} onMoverCarro={handleMoverCarro} />
      ) : (
        <p className="text-gray-400">Layout não configurado para este galpão.</p>
      )}
    </div>
  );
};