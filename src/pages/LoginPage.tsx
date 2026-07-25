import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoPrincipal from '../assets/logos/logo-principal.png';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);
    if (error) {
      setErro('E-mail ou senha inválidos.');
      return;
    }
    navigate('/inicio');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mro-azul to-mro-azul-claro">
      <form onSubmit={handleLogin} className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-center mb-2">
          <img src={logoPrincipal} alt="MRO" className="h-12 w-auto" />
        </div>
        <p className="text-gray-500 text-center mb-6">Sistema de Gestão de Vagas</p>

        {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

        <label className="block text-sm mb-1">📧 E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          required
        />

        <label className="block text-sm mb-1">🔒 Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          required
        />

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-mro-azul text-white py-2 rounded hover:bg-mro-azul-claro disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'ENTRAR'}
        </button>

        <p className="text-center text-sm mt-4">
          Não tem conta? <Link to="/cadastro" className="text-mro-azul font-medium">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
};