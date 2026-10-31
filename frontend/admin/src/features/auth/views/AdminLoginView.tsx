import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@tram/ui';
import { useAdminLoginViewModel } from '../view-models/useAdminAuthViewModel';

export function AdminLoginView({ notice }: { notice?: string }) {
  const vm = useAdminLoginViewModel();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Trạm Video – Quản trị</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={vm.onSubmit} className="space-y-4" noValidate>
            {notice && <Alert variant="destructive">{notice}</Alert>}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" autoComplete="email" {...vm.register('email')} />
              {vm.errors.email && <p className="text-sm text-destructive">{vm.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Mật khẩu</Label>
              <Input type="password" autoComplete="current-password" {...vm.register('password')} />
            </div>
            {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
            <Button type="submit" className="w-full" disabled={vm.isSubmitting}>
              {vm.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
