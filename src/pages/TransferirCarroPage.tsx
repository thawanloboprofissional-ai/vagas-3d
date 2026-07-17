import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const TransferirCarroPage = () => {
  const { carroId } = useParams();
  const navigate = useNavigate();
  const [galpaoDestino, setGalpaoDestino] = useState('');
  const [vagasLivres, setVagasLivres] = useState<any[]>([]);
  const [vagaDestino, setVagaDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [galpoes, setGalpoes] = useState<any[]>([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    supabase.from('galpoes').select('*').then(({ data }) => setGalpoes(data || []));
  }, []);

  useEffect(() => {
    if (!galpaoDestino) return;
    supabase
      .from('vagas')
      .select('*')
      .eq('galpao_id', galpaoDestino)
      .eq('status', 'livre')
      .is('tipo_especial', null)
      .then(({ data }) => setVagasLivres(data || []));
  }, [galpaoDestino]);

  const handleTransferir = async () => {
    setErro('');
    if (!vagaDestino) return setErro('Selecione a vaga de destino.');
    setSalvando(true);
    const { error } = await supabase.rpc('transferir_carro_entre_galpoes', {
      p_carro_id: carroId,
      p_vaga_destino_id: vagaDestino,
      p_motivo: motivo || null,
    });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    navigate('/inicio');
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow p-6">
      <h1 className="text-lg font-bold text-mro-azul mb-4">🔄 Transferir Carro</h1>

      {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

      <label className="block text-sm mb-1">🎯 Galpão Destino</label>
      <select value={galpaoDestino} onChange={(e) => setGalpaoDestino(e.target.value)} className="w-full border rounded px-3 py-2 mb-4">
        <option value="">Selecione...</option>
        {galpoes.map((g) => (
          <option key={g.id} value={g.id}>{g.nome}</option>
        ))}
      </select>

      {galpaoDestino && (
        <>
          <label className="block text-sm mb-1">Vaga Destino (livres)</label>
          <select value={vagaDestino} onChange={(e) => setVagaDestino(e.target.value)} className="w-full border rounded px-3 py-2 mb-4">
            <option value="">Selecione...</option>
            {vagasLivres.map((v) => (
              <option key={v.id} value={v.id}>Rua {v.rua} · {v.codigo}</option>
            ))}
          </select>
        </>
      )}

      <label className="block text-sm mb-1">📝 Motivo (opcional)</label>
      <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" />

      <div className="flex gap-2">
        <button onClick={handleTransferir} disabled={salvando} className="flex-1 bg-mro-azul text-white py-2 rounded hover:bg-mro-azul-claro disabled:opacity-50">
          {salvando ? 'Transferindo...' : '🔄 CONFIRMAR TRANSFERÊNCIA'}
        </button>
        <button onClick={() => navigate(-1)} className="flex-1 border py-2 rounded">❌ CANCELAR</button>
      </div>
    </div>
  );
};