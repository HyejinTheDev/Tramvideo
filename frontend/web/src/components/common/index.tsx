import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@tram/ui';

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
      <div className="text-4xl">📭</div>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Pagination(props: {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (props.totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={!props.hasPrev} onClick={props.onPrev}>
        ← Trước
      </Button>
      <span className="text-sm text-muted-foreground">
        Trang {props.page}/{props.totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={!props.hasNext} onClick={props.onNext}>
        Sau →
      </Button>
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-6 text-2xl font-bold">{children}</h1>;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  override render() {
    if (this.state.error) {
      return (
        <EmptyState
          text="Có lỗi xảy ra khi hiển thị trang."
          action={<Button onClick={() => window.location.reload()}>Tải lại trang</Button>}
        />
      );
    }
    return this.props.children;
  }
}
