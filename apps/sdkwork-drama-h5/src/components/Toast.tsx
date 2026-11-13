import { useEffect } from 'react';

export interface ToastMessage {
  readonly tone: 'success' | 'error' | 'info';
  readonly text: string;
}

export function Toast({
  message,
  onDismiss,
}: {
  readonly message: ToastMessage | null;
  readonly onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDismiss, message.tone === 'error' ? 8000 : 4000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div className="toast" data-tone={message.tone} role="status">
      <span>{message.text}</span>
      <button type="button" className="toast-close" aria-label="Dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
