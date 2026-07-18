interface Vaga {
  id: string;
  codigo: string;
  rua: string;
  status: string;
  carro_id: string | null;
}

function getColor(vaga: Vaga) {
  if (vaga.status === 'ocupado') return '#dc2626';
  if (vaga.status === 'bloqueado') return '#6b7280';
  return '#16a34a';
}

// Extrai o número do final do código da vaga (ex: "B4" -> 4, "AJ5" -> 5)
function extrairColuna(codigo: string): number {
  const match = codigo.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

export const Mapa2D = ({
  vagas,
  ordemRuas,
  onVagaClick,
}: {
  vagas: Vaga[];
  ordemRuas: string[];
  onVagaClick: (id: string) => void;
}) => {
  // Agrupa as vagas por rua
  const porRua = new Map<string, Vaga[]>();
  vagas.forEach((v) => {
    if (!porRua.has(v.rua)) porRua.set(v.rua, []);
    porRua.get(v.rua)!.push(v);
  });

  // Ordena as ruas na ordem física real (ordemRuas); ruas não previstas vão para o final
  const ruasOrdenadas = [
    ...ordemRuas.filter((r) => porRua.has(r)),
    ...[...porRua.keys()].filter((r) => !ordemRuas.includes(r)).sort(),
  ];

  const maxColuna = Math.max(1, ...vagas.map((v) => extrairColuna(v.codigo)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {ruasOrdenadas.map((rua) => {
        const vagasDaRua = [...(porRua.get(rua) || [])].sort(
          (a, b) => extrairColuna(a.codigo) - extrairColuna(b.codigo)
        );
        return (
          <div key={rua} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '32px', fontWeight: 700, color: '#0B2545', textAlign: 'right' }}>
              {rua}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${maxColuna}, 1fr)`,
                gap: '4px',
                flex: 1,
              }}
            >
              {Array.from({ length: maxColuna }, (_, i) => i + 1).map((coluna) => {
                const vaga = vagasDaRua.find((v) => extrairColuna(v.codigo) === coluna);
                if (!vaga) {
                  return <div key={coluna} />;
                }
                return (
                  <div
                    key={vaga.id}
                    onClick={() => onVagaClick(vaga.id)}
                    title={`${vaga.codigo} — ${vaga.status}`}
                    style={{
                      aspectRatio: '1 / 1',
                      backgroundColor: getColor(vaga),
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
                    {vaga.codigo}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};