interface ErrorPageProps {
  error: Error;
  onRetry: () => void;
}

export const ErrorPage = ({ error, onRetry }: ErrorPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mro-azul">
      <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-xl font-bold text-mro-azul mb-2">
          Não foi possível conectar ao sistema
        </h1>
        <p className="text-gray-600 mb-4">
          Estamos tendo problemas para acessar o servidor.
        </p>
        <div className="bg-gray-50 rounded p-3 text-left text-sm mb-4">
          <p><strong>Erro:</strong> {error.message}</p>
          <p><strong>Ambiente:</strong> {import.meta.env.MODE}</p>
          <p><strong>Versão:</strong> {import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
        </div>
        <button
          onClick={onRetry}
          className="w-full bg-mro-azul text-white py-2 rounded mb-2 hover:bg-mro-azul-claro"
        >
          🔄 Tentar Novamente
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full border border-mro-azul text-mro-azul py-2 rounded hover:bg-gray-50"
        >
          🔄 Recarregar App
        </button>
      </div>
    </div>
  );
};