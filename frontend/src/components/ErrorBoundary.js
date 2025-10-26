import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // You can also log the error to an error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      const { error, errorInfo, errorCount } = this.state;
      const { fallback, showDetails = process.env.NODE_ENV === 'development' } = this.props;

      // If custom fallback provided, use it
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-grey-50 dark:bg-grey-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-grey-800 rounded-lg shadow-xl p-8 border-l-4 border-danger">
              {/* Error Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="bg-danger/10 p-4 rounded-full">
                  <AlertTriangle size={48} className="text-danger" strokeWidth={2} />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-grey-900 dark:text-white text-center mb-3">
                Oops! Something went wrong
              </h1>

              {/* Error Description */}
              <p className="text-grey-600 dark:text-grey-400 text-center mb-6">
                We're sorry for the inconvenience. The application encountered an unexpected error.
              </p>

              {/* Error Count Warning */}
              {errorCount > 2 && (
                <div className="bg-warning/10 border border-warning rounded-lg p-4 mb-6">
                  <p className="text-warning text-sm font-medium text-center">
                    ⚠️ Multiple errors detected. You may need to refresh the page or contact support.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-shoprite-red text-white rounded-lg font-medium hover:bg-shoprite-redDark transition-colors duration-200"
                >
                  <RefreshCw size={20} />
                  Try Again
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-grey-200 dark:bg-grey-700 text-grey-900 dark:text-white rounded-lg font-medium hover:bg-grey-300 dark:hover:bg-grey-600 transition-colors duration-200"
                >
                  <Home size={20} />
                  Go to Dashboard
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-6 py-3 border-2 border-grey-300 dark:border-grey-600 text-grey-700 dark:text-grey-300 rounded-lg font-medium hover:bg-grey-50 dark:hover:bg-grey-700 transition-colors duration-200"
                >
                  Reload Page
                </button>
              </div>

              {/* Technical Details (Development Mode) */}
              {showDetails && error && (
                <details className="bg-grey-50 dark:bg-grey-900 rounded-lg p-4 border border-grey-200 dark:border-grey-700">
                  <summary className="cursor-pointer font-semibold text-grey-900 dark:text-white mb-2 hover:text-shoprite-red transition-colors">
                    🔧 Technical Details (Development Mode)
                  </summary>

                  <div className="space-y-4 mt-4">
                    {/* Error Message */}
                    <div>
                      <h3 className="text-sm font-semibold text-grey-700 dark:text-grey-300 mb-2">
                        Error Message:
                      </h3>
                      <pre className="bg-white dark:bg-grey-800 p-3 rounded border border-grey-200 dark:border-grey-700 text-xs overflow-x-auto text-danger">
                        {error.toString()}
                      </pre>
                    </div>

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <h3 className="text-sm font-semibold text-grey-700 dark:text-grey-300 mb-2">
                          Component Stack:
                        </h3>
                        <pre className="bg-white dark:bg-grey-800 p-3 rounded border border-grey-200 dark:border-grey-700 text-xs overflow-x-auto text-grey-700 dark:text-grey-300 max-h-48 overflow-y-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}

                    {/* Error Stack */}
                    {error.stack && (
                      <div>
                        <h3 className="text-sm font-semibold text-grey-700 dark:text-grey-300 mb-2">
                          Error Stack:
                        </h3>
                        <pre className="bg-white dark:bg-grey-800 p-3 rounded border border-grey-200 dark:border-grey-700 text-xs overflow-x-auto text-grey-700 dark:text-grey-300 max-h-48 overflow-y-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-grey-200 dark:border-grey-700">
                <p className="text-sm text-grey-500 dark:text-grey-400 text-center">
                  If this problem persists, please contact support with the error details above.
                </p>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                💡 <strong>Quick Tip:</strong> Try clearing your browser cache or using incognito mode if errors persist.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
