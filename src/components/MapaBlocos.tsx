import { useState } from 'react';
import type { LayoutBlocos } from '../config/layoutsGalpoes';

interface VagaDb {
  id: string;
  codigo: string;
  status: string;
  carro_id: string | null;
  carro_codigo?: string | null;
}

interface MapaBlocosProps {
  layout: LayoutBlocos;
  vagas: VagaDb[];
  onMoverCarro: (carroId: string, vagaOrigemId: string, vagaDestinoId: string) => void;
}

function corDaVaga(v: VagaDb | undefined, selecionada: boolean) {
  if (!v) return '#e5e7eb';
  if (selecionada) return '#2563eb';
  if (v.status === 'ocupado') return '#dc2626';
  if (v.status === 'bloqueado') return '#6b7280';
  return '#16a34a';
}

export const MapaBlocos = ({ layout, vagas, onMoverCarro }: MapaBlocosProps) => {
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const porCodigo = new Map(vagas.map((v) => [v.codigo, v]));
  const selecionada = vagas.find((v) => v.id === selecionadaId) || null;

  const handleClick = (v: VagaDb | undefined) => {
    if (!v) return;
    if (!selecionada) {
      if (v.status === 'ocupado' && v.carro_id) setSelecionadaId(v.id);
      return;
    }
    if (v.id === selecionada.id) {
      setSelecionadaId(null);
      return;
    }
    if (v.status === 'livre') {
      onMoverCarro(selecionada.carro_id as string, selecionada.id, v.id);
      setSelecionadaId(null);
    }
  };

  const renderCelula = (codigo: string, key: string) => {
    const v = porCodigo.get(codigo);
    const sel = v?.id === selecionadaId;
    return (
      <div
        key={key}
        onClick={() => handleClick(v)}
        className="flex flex-col items-center justify-center text-[8px] md:text-[9px] font-bold text-white rounded cursor-pointer border border-mro-azul leading-tight text-center px-0.5 w-9 h-9 md:w-[46px] md:h-[46px] flex-shrink-0"
        style={{ background: corDaVaga(v, sel) }}
        title={v ? `${v.codigo} — ${v.status}${v.carro_codigo ? ' — ' + v.carro_codigo : ''}` : `${codigo} (sem dado no banco)`}
      >
        <span>{codigo}</span>
        {v?.carro_codigo && <span>{v.carro_codigo}</span>}
        {!v && <span className="opacity-60">?</span>}
      </div>
    );
  };

  const renderBloco = (rua: string) => {
    const bloco = layout.blocos[rua];
    if (!bloco) return null;
    return (
      <div key={rua} className="border rounded-lg p-1.5 bg-gray-50">
        <p className="text-[9px] md:text-[10px] text-gray-400 font-semibold text-center mb-1">{rua}</p>
        <div className="flex flex-col gap-1">
          {bloco.linhas.map((linha, i) => (
            <div key={i} className="flex gap-1">
              {linha.map((codigo, j) => renderCelula(codigo, `${rua}-${i}-${j}`))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-3 md:p-4">
      {selecionada ? (
        <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs md:text-sm rounded px-3 py-2">
          🚗 Carro <strong>{selecionada.carro_codigo}</strong> selecionado (vaga {selecionada.codigo}) — clique numa vaga <strong>livre</strong> para mover, ou clique nela de novo para cancelar.
        </div>
      ) : (
        <div className="mb-3 bg-gray-50 border text-gray-600 text-xs md:text-sm rounded px-3 py-2">
          Clique numa vaga <strong>ocupada</strong> (vermelha) para selecionar o carro, depois clique numa vaga <strong>livre</strong> (verde) para movê-lo.
        </div>
      )}

      <div className="overflow-auto" style={{ maxWidth: '100%', maxHeight: '75vh', WebkitOverflowScrolling: 'touch' }}>
        <div className="inline-flex gap-6 items-start pb-3">
          <div className="flex flex-col gap-2">
            {layout.grupoEsquerdo.map((rua) => renderBloco(rua))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {layout.grupoDireito.map((rua) => renderBloco(rua))}
          </div>
        </div>
      </div>
      <div className="text-center text-xs font-semibold text-gray-400 border-t pt-2 mt-1">— CORREDOR —</div>
      <p className="text-xs text-gray-400 mt-2 md:hidden">💡 Arraste o mapa com o dedo para navegar.</p>
    </div>
  );
};