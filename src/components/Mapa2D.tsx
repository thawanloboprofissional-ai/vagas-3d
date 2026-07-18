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
  const colunas = 12;
  return vagas.map((vaga, i) => ({
    vaga,
    x: i % colunas,
    y: Math.floor(i / colunas),
  }));
}

export const Mapa2D = ({ vagas, onVagaClick }: { vagas: Vaga[]; onVagaClick: (id: string) => void }) => {
  const posicoes = calcularPosicoesVagas(vagas);
  const colunas = posicoes.length > 0 ? Math.max(...posicoes.map((p) => p.x)) + 1 : 1;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${colunas}, 1fr)`,
        gap: '4px',
        width: '100%',
      }}
    >
      {posicoes.map((p) => (
        <div
          key={p.vaga.id}
          onClick={() => onVagaClick(p.vaga.id)}
          title={`${p.vaga.codigo} — ${p.vaga.status}`}
          style={{
            aspectRatio: '1 / 1',
            backgroundColor: getColor(p.vaga),
            borderRadius: '4px',
            border: '1px solid #0B2545',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {p.vaga.codigo}
        </div>
      ))}
    </div>
  );
};