import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const EditarCarroPage = () => {
  const { carroId } = useParams();
  const navigate = useNavigate();
  const [numeroSerie, setNumeroSerie] = useState('');
  const [descricao, setDescricao] = useState('');
  const [carro, setCarro] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!carroId) return;
    supabase.from('carros').select('*').eq('id', carroId).single().then(({ data }) => {
      if (data) {
        setCarro(data);
        setDescricao(data.descricao || '');
        setNumeroSerie(data.codigo?.replace('C1-', '') || '');
      }
    });
  }, [carroId]);

  const handleSalvar = async () => {
    setErro('');
    if (!/^\d+$/.test(numeroSerie)) {
      setErro('Número de série deve conter apenas números.');
      return;
    }
    setSalvando(true);
    const { error } = await supabase.rpc('atualizar_carro', {
      p_carro_id: carroId,
      p_numero_serie: numeroSerie,
      p_descricao: descricao,
    });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    navigate(-1);
  };

  if (!carro) return <div className="p-6">Carregando...</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow p-6">
      <h1 className="text-lg font-bold text-mro-azul mb-4">✏️ Editar Carro: {carro.codigo}</h1>

      {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

      <label className="block text-sm mb-1">🔢 Número de Série</label>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-500">C1-</span>
        <input
          value={numeroSerie}
          onChange={(e) => setNumeroSerie(e.target.value.replace(/\D/g, ''))}
          className="border rounded px-3 py-2 flex-1"
        />
      </div>
      <p className="text-xs text-gray-400 mb-4">O código completo será C1-{numeroSerie.padStart(4, '0')}</p>

      <label className="block text-sm mb-1">📋 Descrição/Observação</label>
      <textarea
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
        rows={3}
      />

      <p className="text-sm text-gray-500 mb-4">📊 Status atual: <strong>{carro.status}</strong></p>

      <div className="flex gap-2">
        <button onClick={handleSalvar} disabled={salvando} className="flex-1 bg-mro-azul text-white py-2 rounded hover:bg-mro-azul-claro disabled:opacity-50">
          💾 {salvando ? 'Salvando...' : 'SALVAR'}
        </button>
        <button onClick={() => navigate(-1)} className="flex-1 border py-2 rounded">
          Cancelar
        </button>
      </div>
    </div>
  );
};