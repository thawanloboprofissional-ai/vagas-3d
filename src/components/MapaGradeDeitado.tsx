import { useState } from 'react';
import type { LayoutDeitado, CelulaLayout } from '../config/layoutsGalpoes';

interface VagaDb {
  id: string;
  codigo: string;
  status: string;
  carro_id: string | null;
  carro_codigo?: string | null;
}

interface MapaGradeDeitadoProps {
  layout: LayoutDeitado;
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

export const MapaGradeDeitado = ({ layout, vagas, onMoverCarro }: MapaGradeDeitadoProps) => {
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const porCodigo = new Map(vagas.map((v) => [v.codigo, v]));
  const selecionada = vagas.find((v) => v.id === selecionadaId) || null;

  const handleClick = (v: VagaDb | undefined) => {
    if (!v) return;
    if (!selecionada) {
      if (v.status === 'ocupado' && v.carro_id) setSelecionadaId(v.id);
      return;
    }
    if (v.id === selecionada.id) { setSelecionadaId(null); return; }
    if (v.status === 'livre') {
      onMoverCarro(selecionada.carro_id as string, selecionada.id, v.id);
      setSelecionadaId(null);
    }
  };

  const renderCelula = (c: CelulaLayout, key: string) => {
    if (c.tipo === 'vazio') {
      return <div key={key} className="w-9 h-9 md:w-[46px] md:h-[46px] flex-shrink-0" />;
    }
    if (c.tipo === 'bloqueio') {
      return (
        <div key={key}
          className="flex items-center justify-center text-[7px] md:text-[8px] font-semibold text-white rounded text-center w-9 h-9 md:w-[46px] md:h-[46px] flex-shrink-0"
          style={{ background: '#9ca3af' }}>
          {c.label}
        </div>
      );
    }
    const v = porCodigo.get(c.codigo);
    const sel = v?.id === selecionadaId;
    return (
      <div key={key}
        onClick={() => handleClick(v)}
        className="flex flex-col items-center justify-center text-[7px] md:text-[8px] font-bold text-white rounded cursor-pointer border border-mro-azul leading-tight text-center px-0.5 w-9 h-9 md:w-[46px] md:h-[46px] flex-shrink-0"
        style={{ background: corDaVaga(v, sel) }}
        title={v ? `${v.codigo} — ${v.status}${v.carro_codigo ? ' — ' + v.carro_codigo : ''}` : `${c.codigo}`}>
        <span>{c.codigo}</span>
        {v?.carro_codigo && <span>{v.carro_codigo}</span>}
        {!v && <span className="opacity-50">?</span>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow p-3 md:p-4">
      {selecionada ? (
        <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs md:text-sm rounded px-3 py-2">
          🚗 Carro <strong>{selecionada.carro_codigo}</strong> (vaga {selecionada.codigo}) — clique numa vaga <strong>livre</strong> para mover, ou clique nela de novo para cancelar.
        </div>
      ) : (
        <div className="mb-3 bg-gray-50 border text-gray-600 text-xs md:text-sm rounded px-3 py-2">
          Clique numa vaga <strong>ocupada</strong> (vermelha) para selecionar, depois clique numa <strong>livre</strong> (verde) para mover.
        </div>
      )}

      <div className="overflow-auto" style={{ maxWidth: '100%', maxHeight: '75vh', WebkitOverflowScrolling: 'touch' }}>
        <div className="inline-block">

          {/* Fileira de cima (vagas pares) */}
          <div className="flex gap-1 mb-1">
            {/* espaço do label de rua */}
            <div className="w-10 flex-shrink-0" />
            {layout.colunas.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1">
                {col.cima.map((c, ri) => renderCelula(c, `cima-${ci}-${ri}`))}
              </div>
            ))}
          </div>

          {/* Corredor */}
          <div className="flex gap-1 my-2 items-center">
            <div className="w-10 flex-shrink-0 text-[9px] text-gray-400 font-semibold text-right pr-1">RUA</div>
            {layout.colunas.map((col, ci) => (
              <div key={ci} className="w-9 md:w-[46px] flex-shrink-0 text-center text-[8px] md:text-[9px] font-bold text-mro-azul">
                {col.rua}
              </div>
            ))}
          </div>

          {/* Fileira de baixo (vagas ímpares) */}
          <div className="flex gap-1 mt-1">
            <div className="w-10 flex-shrink-0" />
            {layout.colunas.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1">
                {col.baixo.map((c, ri) => renderCelula(c, `baixo-${ci}-${ri}`))}
              </div>
            ))}
          </div>

        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 md:hidden">💡 Arraste para navegar.</p>
    </div>
  );
};