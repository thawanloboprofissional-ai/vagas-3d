import type { ReactNode } from 'react';
import { usePerfil } from '../context/PerfilContext';

interface RequireRoleProps {
  allowed: string[];
  children: ReactNode;
}

export const RequireRole = ({ allowed, children }: RequireRoleProps) => {
  const { perfil, carregando } = usePerfil();

  if (carregando) {
    return <div className="p-6 text-gray-400 text-sm">Carregando...</div>;
  }

  if (!perfil || !allowed.includes(perfil)) {
    return (
      <div className="p-6">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto shadow">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="font-bold text-mro-azul mb-2">Acesso restrito</h2>
          <p className="text-sm text-gray-500">
            Esta área é exclusiva para {allowed.join(' ou ')}. Fale com um administrador se precisar de acesso.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};