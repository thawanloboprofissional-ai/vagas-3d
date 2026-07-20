import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { diagnosticarApp } from './utils/diagnostico';
import { ErrorPage } from './pages/ErrorPage';
import { LoginPage } from './pages/LoginPage';
import { CadastroPage } from './pages/CadastroPage';
import { EditarCarroPage } from './pages/EditarCarroPage';
import { InicioPage } from './pages/InicioPage';
import { TransferirCarroPage } from './pages/TransferirCarroPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { GalpoesPage } from './pages/GalpoesPage';
import { Mapa2DPage } from './pages/Mapa2DPage';
import { LocaisExternosPage } from './pages/LocaisExternosPage';
import { AuditoriaCarrosPage } from './pages/AuditoriaCarrosPage';
import { ManutencaoPage } from './pages/ManutencaoPage';
import { Layout } from './components/Layout';
import { RequireRole } from './components/RequireRole';
import { ErrorBoundary } from './components/ErrorBoundary';

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
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />

          <Route element={<Layout />}>
            <Route path="/inicio" element={<InicioPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/galpoes" element={<GalpoesPage />} />
            <Route path="/mapa2d/:galpaoId" element={<Mapa2DPage />} />
            <Route path="/locais-externos" element={<LocaisExternosPage />} />
            <Route path="/manutencao" element={<ManutencaoPage />} />
            <Route
              path="/auditoria"
              element={
                <RequireRole allowed={['admin', 'supervisor']}>
                  <AuditLogPage />
                </RequireRole>
              }
            />
            <Route
              path="/auditoria-carros"
              element={
                <RequireRole allowed={['admin', 'supervisor']}>
                  <AuditoriaCarrosPage />
                </RequireRole>
              }
            />
            <Route
              path="/carro/:carroId/editar"
              element={
                <RequireRole allowed={['admin']}>
                  <EditarCarroPage />
                </RequireRole>
              }
            />
            <Route path="/transferir/:carroId" element={<TransferirCarroPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;