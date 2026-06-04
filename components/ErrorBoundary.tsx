import React, { ErrorInfo, ReactNode } from 'react';
import Button from './Button';
import { RefreshCw, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleResetData = () => {
    if (window.confirm("Hành động này sẽ xóa toàn bộ tiến độ học và các khóa học đã ghim trong LocalStorage để khôi phục trạng thái ban đầu. Bạn có chắc chắn muốn thực hiện?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      localStorage.removeItem('last_active_course_name');
      localStorage.removeItem('gdrive_default_course_name');
      window.location.href = '/';
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              padding: '24px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.025em' }}>Đã xảy ra lỗi hệ thống</h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>React component crash detected.</p>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                Hệ thống gặp sự cố khi dựng giao diện khóa học (thường do đồng bộ dữ liệu hoặc cache bộ nhớ bị lỗi từ Google Drive). Hãy chọn một trong các thao tác khôi phục bên dưới:
              </p>

              {this.state.error && (
                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '6px',
                  padding: '16px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  color: '#0f172a',
                  wordBreak: 'break-all',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  <strong style={{ display: 'block', marginBottom: '6px', color: '#dc2626' }}>Chi tiết lỗi:</strong>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <span style={{ display: 'block', marginTop: '8px', color: '#64748b', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </span>
                  )}
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '10px',
                marginTop: '10px'
              }}>
                <Button 
                  onClick={this.handleReload}
                  variant="dark"
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    height: 'auto',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    width: '100%',
                  }}
                  icon={RefreshCw}
                >
                  Tải lại trang (Reload)
                </Button>

                <Button 
                  onClick={this.handleGoHome}
                  variant="secondary"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    height: 'auto',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    width: '100%',
                  }}
                  icon={Home}
                >
                  Quay lại trang chủ (Bỏ qua khóa học lỗi)
                </Button>

                <Button 
                  onClick={this.handleResetData}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    borderColor: '#fca5a5',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    height: 'auto',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    width: '100%',
                  }}
                  icon={Trash2}
                >
                  Xóa bộ nhớ đệm ứng dụng (Reset Cache)
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
