import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarMatricula = (m: string) => /^[A-Z0-9-]+$/.test(m) && m.length >= 4;
const forcaSenha = (senha: string) => {
  let pontos = 0;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[a-z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  return pontos;
};

export const CadastroPage = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const forca = forcaSenha(senha);
  const corForca = forca <= 2 ? 'bg-red-500' : forca === 3 ? 'bg-yellow-500' : 'bg-green-500';
  const textoForca = forca <= 2 ? 'Fraca' : forca === 3 ? 'Média' : 'Forte ✅';

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (nome.trim().length < 3) return setErro('Nome deve ter pelo menos 3 letras.');
    if (!validarEmail(email)) return setErro('E-mail inválido.');
    if (!validarMatricula(matricula)) return setErro('Matrícula inválida (letras, números ou hífen, mín. 4).');
    if (senha.length < 8) return setErro('Senha deve ter no mínimo 8 caracteres.');
    if (senha !== confirmarSenha) return setErro('As senhas não coincidem.');

    setCarregando(true);
    const { error } = await supabase.rpc('criar_usuario_completo', {
      p_email: email,
      p_senha: senha,
      p_nome: nome,
      p_matricula: matricula,
      p_perfil: 'operador',
    });
    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mro-azul to-mro-azul-claro">
      <form onSubmit={handleCadastro} className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h1 className="text-xl font-bold text-mro-azul mb-1">📋 CRIAR CONTA</h1>
        <p className="text-gray-500 text-sm mb-6">Preencha os dados para acessar</p>

        {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

        <label className="block text-sm mb-1">👤 Nome Completo</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" required />

        <label className="block text-sm mb-1">📧 E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" required />

        <label className="block text-sm mb-1">🆔 Matrícula</label>
        <input value={matricula} onChange={(e) => setMatricula(e.target.value.toUpperCase())} className="w-full border rounded px-3 py-2 mb-3" required />

        <label className="block text-sm mb-1">🔒 Senha (mínimo 8 caracteres)</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full border rounded px-3 py-2 mb-1" required />
        {senha && (
          <div className="mb-3">
            <div className="h-1.5 rounded bg-gray-200 overflow-hidden">
              <div className={`h-full ${corForca}`} style={{ width: `${(forca / 4) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-500">{textoForca}</span>
          </div>
        )}

        <label className="block text-sm mb-1">✅ Confirmar Senha</label>
        <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" required />

        <button type="submit" disabled={carregando} className="w-full bg-mro-azul text-white py-2 rounded hover:bg-mro-azul-claro disabled:opacity-50">
          {carregando ? 'Cadastrando...' : '📝 CADASTRAR'}
        </button>

        <p className="text-center text-sm mt-4">
          Já tem conta? <Link to="/" className="text-mro-azul font-medium">Faça login</Link>
        </p>
      </form>
    </div>
  );
};