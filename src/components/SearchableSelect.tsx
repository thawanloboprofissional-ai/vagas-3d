import { useState, useRef, useEffect } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Digite para buscar...',
  emptyMessage = 'Nenhuma opção encontrada',
  disabled = false,
}: SearchableSelectProps) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) || null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const termo = query.trim().toLowerCase();
  const filtrados = termo
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(termo) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(termo))
      )
    : options;

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
  };

  const handleSelect = (opt: SearchableOption) => {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className={`flex items-center border rounded px-3 py-2 ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
        <span className="mr-2 text-gray-400">🔍</span>
        <input
          value={open ? query : selected ? selected.label : ''}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 outline-none text-sm min-w-0 disabled:bg-gray-100"
        />
        {(selected || query) && !disabled && (
          <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 ml-2">
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-56 overflow-y-auto">
          {filtrados.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">{emptyMessage}</div>
          ) : (
            filtrados.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                className={`px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
                  opt.value === value ? 'bg-blue-50 font-medium' : ''
                }`}
              >
                {opt.label}
                {opt.sublabel && <span className="text-xs text-gray-400 ml-2">{opt.sublabel}</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};