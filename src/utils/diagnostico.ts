import { supabase } from '../lib/supabase';

export async function diagnosticarApp() {
  const resultados = {
    supabase_url: false,
    supabase_anon: false,
    conexao_supabase: false,
    auth: false,
  };

  if (import.meta.env.VITE_SUPABASE_URL) {
    resultados.supabase_url = true;
  } else {
    console.error('❌ VITE_SUPABASE_URL não definida');
  }

  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    resultados.supabase_anon = true;
  } else {
    console.error('❌ VITE_SUPABASE_ANON_KEY não definida');
  }

  try {
    const { error } = await supabase.from('galpoes').select('count');
    if (!error) resultados.conexao_supabase = true;
    else console.error('❌ Erro ao conectar com Supabase:', error);
  } catch (e) {
    console.error('❌ Falha na conexão Supabase:', e);
  }

  const session = await supabase.auth.getSession();
  resultados.auth = !!session.data.session;

  return resultados;
}