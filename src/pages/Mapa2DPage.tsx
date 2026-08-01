import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MapaGrade } from '../components/MapaGrade';
import { MapaBlocos } from '../components/MapaBlocos';
import {
  layoutGalpaoA,
  layoutGalpaoB,
  layoutGalpaoD,
  layoutMG3_1Piso,
} from '../config/layoutsGalpoes';

const layoutsLinha: Record<string, any> = {
  A: layoutGalpaoA,
  B: layoutGalpaoB,
  D: layoutGalpaoD,
};

const layoutsBlocos: Record<string, any> = {
  MG3_1PISO: layoutMG3_1Piso,
};

const GALPOES_DEITADOS = new Set(['D']);

export const Mapa2DPage = () => {
  const { galpaoId } = useParams();
  const [vagas, setVagas] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [wrapperSize, setWrapperSize] = useState({ w: 0, h: 0 });

  const deitado = galpaoId ? GALPOES_DEITADOS.has(galpaoId) : false;

  const carregarVagas = useCallback(() => {
    if (!galpaoId) return;
    supabase
      .from('vagas')
      .select('*, carros!vagas_carro_id_fkey(codigo)')
      .eq('galpao_id', galpaoId)
      .then(({ data, error }) => {
        if (error) { setErro('Erro ao carregar vagas: ' + error.message); return; }
        setVagas((data || []).map((v: any) => ({ ...v, carro_codigo: v.carros?.codigo || null })));
      });
  }, [galpaoId]);

  useEffect(() => { carregarVagas(); }, [carregarVagas]);

  // Após vagas carregarem, mede o mapa e ajusta o wrapper
  useEffect(() => {
    if (!deitado || !innerRef.current) return;

    const el = innerRef.current;
    // Força layout antes de medir
    requestAnimationFrame(() => {
      const mapaW = el.scrollWidth;
      const mapaH = el.scrollHeight;
      // Após girar 90°, largura e altura trocam
      setWrapperSize({ w: mapaH, h: mapaW });
    });
  }, [vagas, deitado]);

  const handleMoverCarro = async (carroId: string, _origem: string, destino: string) => {
    setErro('');
    const { error } = await supabase.rpc('transferir_carro_entre_galpoes', {
      p_carro_id: carroId,
      p_vaga_destino_id: destino,
      p_motivo: 'Movido pelo mapa',
    });
    if (error) { setErro('Erro ao mover carro: ' + error.message); return; }
    carregarVagas();
  };

  const linhas = galpaoId ? layoutsLinha[galpaoId] : null;
  const blocos = galpaoId ? layoutsBlocos[galpaoId] : null;

  const renderMapa = () => {
    if (linhas) return <MapaGrade linhas={linhas} vagas={vagas} onMoverCarro={handleMoverCarro} />;
    if (blocos) return <MapaBlocos layout={blocos} vagas={vagas} onMoverCarro={handleMoverCarro} />;
    return <p className="text-gray-400">Layout não configurado para este galpão.</p>;
  };

  return (
    <div className="p-4 md:p-6">
      <Link to="/galpoes" className="text-sm text-mro-azul mb-4 inline-block">← Voltar para Galpões</Link>
      <h1 className="text-lg font-bold text-mro-azul mb-4">
        Galpão {galpaoId} — Mapa de Vagas
      </h1>
      {erro && <p className="text-red-600 text-sm mb-3">{erro}</p>}

      {deitado ? (
        // Wrapper com tamanho invertido para acomodar o mapa girado
        <div
          ref={wrapperRef}
          style={{
            width: wrapperSize.w > 0 ? `${wrapperSize.w}px` : '100%',
            height: wrapperSize.h > 0 ? `${wrapperSize.h}px` : '600px',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <div
            ref={innerRef}
            style={{
              position: 'absolute',
              transformOrigin: 'top left',
              transform: `rotate(90deg) translateY(-100%)`,
              top: 0,
              left: 0,
            }}
          >
            {renderMapa()}
          </div>
        </div>
      ) : (
        renderMapa()
      )}
    </div>
  );
};