import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const TransferirCarroPage = () => {
  const { carroId } = useParams();
  const navigate = useNavigate();

  const [carregandoCarro, setCarregandoCarro] = useState(true);
  const [carroInfo, setCarroInfo] = useState<any>(null);

  const [tipoDestino, setTipoDestino] = useState<'vaga' | 'externo'>('vaga');
  const [galpaoDestino, setGalpaoDestino] = useState('');
  const [vagasLivres, setVagasLivres] = useState<any[]>([]);
  const [vagaDestino, setVagaDestino] = useState('');
  const [galpoes, setGalpoes] = useState<any[]>([]);
  const [locaisExternos, setLocaisExternos] = useState<any[]>([]);
  const [localDestino, setLocalDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!carroId) return;
    supabase.from('carros').select('id, codigo, em_manutencao').eq('id', carroId).single().then(({ data }) => {
      setCarroInfo(data);
      setCarregandoCarro(false);
    });
    supabase.from('galpoes').select('*').then(({ data }) => setGalpoes(data || []));
    supabase.from('locais_externos').select('*').order('nome').then(({ data }) => setLocaisExternos(data || []));
  }, [carroId]);

  useEffect(() => {
    if (tipoDestino !== 'vaga' || !galpaoDestino) return;
    supabase
      .from('vagas')
      .select('*')
      .eq('galpao_id', galpaoDestino)
      .eq('status', 'livre')
      .is('tipo_especial', null)
      .then(({ data }) => setVagasLivres(data || []));
  }, [galpaoDestino, tipoDestino]);

  const handleConfirmar = async () => {
    setErro('');

    if (tipoDestino === 'vaga') {
      if (!vagaDestino) return setErro('Selecione a vaga de destino.');
      setSalvando(true);
      const { error } = await supabase.rpc('transferir_carro_entre_galpoes', {
        p_carro_id: carroId,
        p_vaga_destino_id: vagaDestino,
        p_motivo: motivo || null,
      });
      setSalvando(false);
      if (error) return setErro(error.message);
      navigate('/inicio');
      return;
    }

    if (!localDestino) return setErro('Selecione o local externo.');
    setSalvando(true);
    const { error } = await supabase.rpc('mover_carro_para_local_externo', {
      p_carro_id: carroId,
      p_local_externo_id: localDestino,
      p_motivo: motivo || null,
    });
    setSalvando(false);
    if (error) return setErro(error.message);
    navigate('/inicio');
  };

  if (carregandoCarro) {
    return <div className="p-6 text-center text-gray-400">Carregando...</div>;
  }

  if (carroInfo?.em_manutencao) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow p-6 text-center">
        <div className="text-4xl mb-3">🔧</div>
        <h1 className="text-lg font-bold text-mro-azul mb-2">{carroInfo.codigo}</h1>
        <p className="text-red-600 text-sm mb-4">
          Este veículo encontra-se em manutenção e está indisponível para uso operacional.
        </p>
        <button onClick={() => navigate('/manutencao')} className="bg-mro-azul text-white text-sm px-4 py-2 rounded hover:bg-mro-azul-claro">
          Ver na tela de Manutenção
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white rounded-xl shadow p-6">
      <h1 className="text-lg font-bold text-mro-azul mb-4">🔄 Atualizar Localização do Carro</h1>

      {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTipoDestino('vaga')}
          className={`flex-1 py-2 rounded text-sm border ${tipoDestino === 'vaga' ? 'bg-mro-azul text-white border-mro-azul' : 'text-gray-600'}`}
        >
          🅿️ Vaga em Galpão
        </button>
        <button
          onClick={() => setTipoDestino('externo')}
          className={`flex-1 py-2 rounded text-sm border ${tipoDestino === 'externo' ? 'bg-mro-azul text-white border-mro-azul' : 'text-gray-600'}`}
        >
          📍 Local Externo
        </button>
      </div>

      {tipoDestino === 'vaga' ? (
        <>
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
        </>
      ) : (
        <>
          <label className="block text-sm mb-1">📍 Local Externo</label>
          <select value={localDestino} onChange={(e) => setLocalDestino(e.target.value)} className="w-full border rounded px-3 py-2 mb-4">
            <option value="">Selecione...</option>
            {locaisExternos.map((l) => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mb-4">
            Esses locais não têm limite de vagas — vários carros podem ficar no mesmo local ao mesmo tempo.
          </p>
        </>
      )}

      <label className="block text-sm mb-1">📝 Motivo (opcional)</label>
      <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" />

      <div className="flex gap-2">
        <button onClick={handleConfirmar} disabled={salvando} className="flex-1 bg-mro-azul text-white py-2 rounded hover:bg-mro-azul-claro disabled:opacity-50">
          {salvando ? 'Salvando...' : '✅ CONFIRMAR'}
        </button>
        <button onClick={() => navigate(-1)} className="flex-1 border py-2 rounded">❌ CANCELAR</button>
      </div>
    </div>
  );
};