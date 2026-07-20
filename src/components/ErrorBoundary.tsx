import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'Erro desconhecido' };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Erro capturado pelo ErrorBoundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-xl shadow p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="font-bold text-mro-azul mb-2">Algo deu errado</h1>
            <p className="text-sm text-gray-500 mb-4 break-words">{this.state.message}</p>
            <button
              onClick={this.handleReload}
              className="bg-mro-azul text-white px-4 py-2 rounded text-sm hover:bg-mro-azul-claro"
            >
              🔄 Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}