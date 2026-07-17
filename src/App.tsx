import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { diagnosticarApp } from './utils/diagnostico';
import { ErrorPage } from './pages/ErrorPage';
import { LoginPage } from './pages/LoginPage';
import { CadastroPage } from './pages/CadastroPage';
import { EditarCarroPage } from './pages/EditarCarroPage';
import { InicioPage } from './pages/InicioPage';
import { TransferirCarroPage } from './pages/TransferirCarroPage';

function App() {
  const [status, setStatus] = useState<'checando' | 'ok' | 'erro'>('checando');
  const [erro, setErro] = useState<Error | null>(null);

  const rodarDiagnostico = async () => {
    setStatus('checando');
    try {
      const resultado = await diagnosticarApp();
      if (resultado.conexao_supabase) {
        setStatus('ok');
      } else {
        setErro(new Error('Falha na conexão com o Supabase'));
        setStatus('erro');
      }
    } catch (e) {
      setErro(e as Error);
      setStatus('erro');
    }
  };

  useEffect(() => {
    rodarDiagnostico();
  }, []);

  if (status === 'checando') {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (status === 'erro' && erro) {
    return <ErrorPage error={erro} onRetry={rodarDiagnostico} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/carro/:carroId/editar" element={<EditarCarroPage />} />
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/transferir/:carroId" element={<TransferirCarroPage />} />
        {/* demais rotas serão adicionadas nas próximas partes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;