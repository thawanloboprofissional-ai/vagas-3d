import { useEffect, useState } from 'react';
import { MapContainer, Rectangle, Popup, Tooltip, useMap } from 'react-leaflet';
import { CRS, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vaga {
  id: string;
  codigo: string;
  status: string;
  carro_id: string | null;
  carro_codigo?: string | null;
}

interface Posicao {
  vaga: Vaga;
  x: number;
  y: number;
}

function getColor(vaga: Vaga, selecionada: boolean) {
  if (selecionada) return '#2563eb';
  if (vaga.status === 'ocupado') return '#dc2626';
  if (vaga.status === 'bloqueado') return '#6b7280';
  return '#16a34a';
}

function calcularPosicoesVagas(vagas: Vaga[]): Posicao[] {
  const colunas = 12;
  return vagas.map((vaga, i) => ({
    vaga,
    x: i % colunas,
    y: Math.floor(i / colunas),
  }));
}

const AjustarVisao = ({ posicoes }: { posicoes: Posicao[] }) => {
  const map = useMap();
  useEffect(() => {
    if (posicoes.length === 0) return;
    const bounds = new LatLngBounds(
      posicoes.map((p) => [p.y - 0.5, p.x - 0.5] as [number, number])
    );
    posicoes.forEach((p) => bounds.extend([p.y + 0.5, p.x + 0.5]));
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
  }, [posicoes, map]);
  return null;
};

interface Mapa2DProps {
  vagas: Vaga[];
  onMoverCarro: (carroId: string, vagaOrigemId: string, vagaDestinoId: string) => void;
}

export const Mapa2D = ({ vagas, onMoverCarro }: Mapa2DProps) => {
  const posicoes = calcularPosicoesVagas(vagas);
  const [vagaSelecionadaId, setVagaSelecionadaId] = useState<string | null>(null);

  if (vagas.length === 0) {
    return <p className="text-gray-400 text-sm p-4">Nenhuma vaga cadastrada para este galpão ainda.</p>;
  }

  const vagaSelecionada = vagas.find((v) => v.id === vagaSelecionadaId) || null;

  const handleClickVaga = (vaga: Vaga) => {
    // Nenhuma vaga selecionada ainda: só permite selecionar uma vaga OCUPADA (é o carro que vamos mover)
    if (!vagaSelecionada) {
      if (vaga.status === 'ocupado' && vaga.carro_id) {
        setVagaSelecionadaId(vaga.id);
      }
      return;
    }

    // Clicou de novo na mesma vaga selecionada: cancela a seleção
    if (vaga.id === vagaSelecionada.id) {
      setVagaSelecionadaId(null);
      return;
    }

    // Já tem uma vaga de origem selecionada: exige clicar numa vaga LIVRE para mover
    if (vaga.status === 'livre') {
      onMoverCarro(vagaSelecionada.carro_id as string, vagaSelecionada.id, vaga.id);
      setVagaSelecionadaId(null);
    }
  };

  return (
    <div>
      <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded px-3 py-2">
        {vagaSelecionada
          ? <>🚗 Carro <strong>{vagaSelecionada.carro_codigo}</strong> selecionado (vaga {vagaSelecionada.codigo}) — clique numa vaga <strong>livre</strong> para mover, ou clique nela de novo para cancelar.</>
          : <>Clique numa vaga <strong>ocupada</strong> (vermelha) para selecionar o carro, depois clique numa vaga <strong>livre</strong> (verde) para movê-lo.</>
        }
      </div>

      <MapContainer
        center={[0, 0]}
        zoom={1}
        style={{ height: '75vh', width: '100%' }}
        crs={CRS.Simple}
        minZoom={-3}
        maxZoom={12}
        zoomSnap={0.1}
      >
        <AjustarVisao posicoes={posicoes} />
        {posicoes.map((p) => {
          const selecionada = p.vaga.id === vagaSelecionadaId;
          return (
            <Rectangle
              key={p.vaga.id}
              bounds={[[p.y - 0.42, p.x - 0.42], [p.y + 0.42, p.x + 0.42]]}
              pathOptions={{
                fillColor: getColor(p.vaga, selecionada),
                fillOpacity: 0.85,
                color: selecionada ? '#1d4ed8' : '#0B2545',
                weight: selecionada ? 3 : 1,
              }}
              eventHandlers={{ click: () => handleClickVaga(p.vaga) }}
            >
              <Tooltip permanent direction="center" className="vaga-tooltip">
                <div className="text-center leading-tight">
                  <div>{p.vaga.codigo}</div>
                  {p.vaga.carro_codigo && <div>{p.vaga.carro_codigo}</div>}
                </div>
              </Tooltip>
              <Popup>
                <strong>{p.vaga.codigo}</strong>
                <p>Status: {p.vaga.status}</p>
                {p.vaga.carro_codigo && <p>🚗 Carro: <strong>{p.vaga.carro_codigo}</strong></p>}
              </Popup>
            </Rectangle>
          );
        })}
      </MapContainer>
    </div>
  );
};