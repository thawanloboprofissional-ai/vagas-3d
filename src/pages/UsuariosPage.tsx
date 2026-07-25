import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { usePerfil } from '../context/PerfilContext';

interface Usuario {
  id: string;
  nome: string;
  matricula: string;
  perfil: string;
  ativo: boolean;
  criado_em: string;
}

const PERFIL_LABEL: Record<string, string> = {
  operador: 'Operador',
  supervisor: 'Supervisor',
  admin: 'Admin',
};

const PERFIL_COR: Record<string, string> = {
  operador: 'bg-gray-100 text-gray-700',
  supervisor: 'bg-blue-100 text-blue-700',
  admin: 'bg-mro-azul text-white',
};

export const UsuariosPage = () => {
  const { perfil: meuPerfil } = usePerfil();
  const [meuId, setMeuId] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const carregar = useCallback(() => {
    setCarregando(true);
    supabase
      .from('operadores')
      .select('id, nome, matricula, perfil, ativo, criado_em')
      .order('nome')
      .then(({ data, error }) => {
        if (error) {
          setErro('Erro ao carregar usuários: ' + error.message);
        } else {
          setUsuarios(data || []);
        }
        setCarregando(false);
      });
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeuId(data?.user?.id || null));
    carregar();
  }, [carregar]);

  const podePromoverParaAdmin = meuPerfil === 'admin';

  const opcoesPerfilPara = (usuario: Usuario) => {
    if (usuario.id === meuId) return null;
    if (meuPerfil === 'supervisor' && usuario.perfil === 'admin') return null;
    const opcoes = ['operador', 'supervisor'];
    if (podePromoverParaAdmin) opcoes.push('admin');
    return opcoes;
  };

  const handleTrocarPerfil = async (usuario: Usuario, novoPerfil: string) => {
    setErro('');
    setSalvandoId(usuario.id);
    const { error } = await supabase.rpc('atualizar_perfil_usuario', {
      p_operador_id: usuario.id,
      p_novo_perfil: novoPerfil,
    });
    setSalvandoId(null);
    if (error) {
      setErro(error.message);
      return;
    }
    carregar();
  };

  const handleToggleAtivo = async (usuario: Usuario) => {
    setErro('');
    setSalvandoId(usuario.id);
    const { error } = await supabase.rpc('atualizar_status_ativo_usuario', {
      p_operador_id: usuario.id,
      p_ativo: !usuario.ativo,
    });
    setSalvandoId(null);
    if (error) {
      setErro(error.message);
      return;
    }
    carregar();
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return u.nome.toLowerCase().includes(termo) || u.matricula.toLowerCase().includes(termo);
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold text-mro-azul mb-4">👥 Usuários</h1>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-4">
          ⚠️ {erro}
        </div>
      )}

      <div className="mb-4 max-w-sm">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔍 Buscar por nome ou matrícula..."
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-mro-azul">{usuarios.length}</div>
          <div className="text-xs text-gray-500">Total de usuários</div>
        </div>
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-green-600">{usuarios.filter((u) => u.ativo).length}</div>
          <div className="text-xs text-gray-500">Ativos</div>
        </div>
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-mro-azul">{usuarios.filter((u) => u.perfil === 'admin').length}</div>
          <div className="text-xs text-gray-500">Admins</div>
        </div>
        <div className="text-center bg-white rounded-xl shadow py-3">
          <div className="text-xl font-bold text-blue-600">{usuarios.filter((u) => u.perfil === 'supervisor').length}</div>
          <div className="text-xs text-gray-500">Supervisores</div>
        </div>
      </div>

      {carregando ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-3 whitespace-nowrap">Nome</th>
                <th className="p-3 whitespace-nowrap">Matrícula</th>
                <th className="p-3 whitespace-nowrap">Perfil</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 whitespace-nowrap">Cadastrado em</th>
                <th className="p-3 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const opcoes = opcoesPerfilPara(u);
                  const bloqueado = opcoes === null;
                  const salvando = salvandoId === u.id;
                  const souEu = u.id === meuId;
                  return (
                    <tr key={u.id} className="border-b">
                      <td className="p-3 whitespace-nowrap font-medium">
                        {u.nome} {souEu && <span className="text-xs text-gray-400">(você)</span>}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-500">{u.matricula}</td>
                      <td className="p-3 whitespace-nowrap">
                        {bloqueado ? (
                          <span className={`text-xs px-2 py-1 rounded-full ${PERFIL_COR[u.perfil]}`}>
                            {PERFIL_LABEL[u.perfil]} 🔒
                          </span>
                        ) : (
                          <select
                            value={u.perfil}
                            disabled={salvando}
                            onChange={(e) => handleTrocarPerfil(u, e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {opcoes!.map((p) => (
                              <option key={p} value={p}>{PERFIL_LABEL[p]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-400">{new Date(u.criado_em).toLocaleDateString()}</td>
                      <td className="p-3 whitespace-nowrap">
                        {bloqueado ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <button
                            onClick={() => handleToggleAtivo(u)}
                            disabled={salvando}
                            className="text-xs border rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {u.ativo ? '🚫 Desativar' : '✅ Ativar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">
        {meuPerfil === 'supervisor'
          ? 'Como supervisor, você pode promover usuários a Operador ou Supervisor. Apenas administradores podem promover a Admin ou alterar contas de administradores.'
          : 'Como administrador, você pode alterar o perfil de qualquer usuário.'}
      </p>
    </div>
  );
};