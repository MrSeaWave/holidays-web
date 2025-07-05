import type { ReactNode } from 'react';
import { Component } from 'react';

interface IProps {
  fallback?: React.ReactNode;
  children?: ReactNode;
  fallbackRender?: (props: { error: Error; resetError: () => void }) => React.ReactNode;
}

interface IState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): {
    hasError: boolean;
    error: Error;
  } {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    console.error(error);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    const { fallback, fallbackRender, children } = this.props;

    const { hasError, error } = this.state;
    if (hasError) {
      if (fallback) return fallback;
      if (fallbackRender) return fallbackRender({ error: error!, resetError: this.resetError });
      // You can render any custom fallback UI
      return null;
    }

    return children;
  }
}
