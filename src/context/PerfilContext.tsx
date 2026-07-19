import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface PerfilContextValue {
  perfil: string | null;
  carregando: boolean;
}

const PerfilContext = createContext<PerfilContextValue>({ perfil: null, carregando: true });

export const PerfilProvider = ({ children }: { children: ReactNode }) => {
  const [perfil, setPerfil] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        if (ativo) setCarregando(false);
        return;
      }
      const { data } = await supabase.from('operadores').select('perfil').eq('id', uid).single();
      if (ativo) {
        setPerfil(data?.perfil || null);
        setCarregando(false);
      }
    };
    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  return <PerfilContext.Provider value={{ perfil, carregando }}>{children}</PerfilContext.Provider>;
};

export const usePerfil = () => useContext(PerfilContext);