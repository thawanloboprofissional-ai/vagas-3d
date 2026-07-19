import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PerfilProvider, usePerfil } from '../context/PerfilContext';

const LayoutInner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const { perfil } = usePerfil();
  const podeVerAuditoria = perfil === 'admin' || perfil === 'supervisor';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const linkClasses = (path: string) =>
    `block px-4 py-2 rounded mb-1 text-sm ${
      location.pathname === path || location.pathname.startsWith(path + '/')
        ? 'bg-mro-azul-claro text-white font-medium'
        : 'text-gray-200 hover:bg-mro-azul-claro/60'
    }`;

  const fecharMenu = () => setMenuAberto(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between bg-mro-azul px-4 py-3">
        <h1 className="text-white font-bold text-lg">MRO</h1>
        <button onClick={() => setMenuAberto((v) => !v)} className="text-white text-2xl leading-none px-2 py-1" aria-label="Abrir menu">
          {menuAberto ? '✕' : '☰'}
        </button>
      </div>

      <aside className={`${menuAberto ? 'block' : 'hidden'} md:block w-full md:w-56 bg-mro-azul flex-col p-4 md:flex md:min-h-screen`}>
        <h1 className="hidden md:block text-white font-bold text-lg mb-6">MRO</h1>
        <nav className="flex-1">
          <Link to="/inicio" className={linkClasses('/inicio')} onClick={fecharMenu}>🏠 Painel Geral</Link>
          <Link to="/dashboard" className={linkClasses('/dashboard')} onClick={fecharMenu}>📊 Dashboard</Link>
          <Link to="/galpoes" className={linkClasses('/galpoes')} onClick={fecharMenu}>🏭 Galpões</Link>
          <Link to="/mapa2d" className={linkClasses('/mapa2d')} onClick={fecharMenu}>🗺️ Mapas</Link>
          <Link to="/locais-externos" className={linkClasses('/locais-externos')} onClick={fecharMenu}>📍 Locais Externos</Link>
          <Link to="/manutencao" className={linkClasses('/manutencao')} onClick={fecharMenu}>🔧 Manutenção</Link>
          {podeVerAuditoria && (
            <>
              <Link to="/auditoria" className={linkClasses('/auditoria')} onClick={fecharMenu}>🛡️ Auditoria</Link>
              <Link to="/auditoria-carros" className={linkClasses('/auditoria-carros')} onClick={fecharMenu}>🔎 Auditoria de Carros</Link>
            </>
          )}
        </nav>
        <button onClick={handleLogout} className="mt-4 text-sm text-gray-200 border border-gray-400 rounded px-3 py-2 hover:bg-mro-azul-claro/60">
          🚪 Sair
        </button>
      </aside>

      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export const Layout = () => (
  <PerfilProvider>
    <LayoutInner />
  </PerfilProvider>
);