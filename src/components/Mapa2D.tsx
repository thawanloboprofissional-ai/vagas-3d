import { MapContainer, Rectangle, Popup } from 'react-leaflet';
import { CRS, LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vaga {
  id: string;
  codigo: string;
  status: string;
  carro_id: string | null;
}

interface Posicao {
  vaga: Vaga;
  x: number;
  y: number;
}

function getColor(vaga: Vaga) {
  if (vaga.status === 'ocupado') return '#dc2626';
  if (vaga.status === 'bloqueado') return '#6b7280';
  return '#16a34a';
}

// Função simplificada: distribui as vagas numa grade com base no índice.
// Ajuste conforme o layout real de ruas/colunas do seu galpão.
function calcularPosicoesVagas(vagas: Vaga[]): Posicao[] {
  const colunas = 10;
  return vagas.map((vaga, i) => ({
    vaga,
    x: i % colunas,
    y: Math.floor(i / colunas),
  }));
}

export const Mapa2D = ({ vagas, onVagaClick }: { vagas: Vaga[]; onVagaClick: (id: string) => void }) => {
  const posicoes = calcularPosicoesVagas(vagas);

  const bounds: LatLngBoundsExpression | undefined =
    posicoes.length > 0
      ? [
          [Math.min(...posicoes.map((p) => p.y)) - 1, Math.min(...posicoes.map((p) => p.x)) - 1],
          [Math.max(...posicoes.map((p) => p.y)) + 1, Math.max(...posicoes.map((p) => p.x)) + 1],
        ]
      : [[-1, -1], [1, 1]];

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: '600px', width: '100%' }}
      crs={CRS.Simple}
      minZoom={-4}
      maxZoom={5}
    >
      {posicoes.map((p) => (
        <Rectangle
          key={p.vaga.id}
          bounds={[[p.y - 0.4, p.x - 0.4], [p.y + 0.4, p.x + 0.4]]}
          pathOptions={{ fillColor: getColor(p.vaga), fillOpacity: 0.8, color: '#0B2545', weight: 1 }}
          eventHandlers={{ click: () => onVagaClick(p.vaga.id) }}
        >
          <Popup>
            <strong>{p.vaga.codigo}</strong>
            <p>Status: {p.vaga.status}</p>
          </Popup>
        </Rectangle>
      ))}
    </MapContainer>
  );
};