import { Link } from 'react-router-dom';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from '@tram/ui';
import { useAccountViewModel } from '../view-models/useAccountViewModel';

export function AccountView() {
  const vm = useAccountViewModel();
  if (!vm.me) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Tài khoản</h1>

      {vm.needsVerify && (
        <Alert>
          Email của bạn chưa được xác thực.{' '}
          {vm.resendDone ? (
            <span className="font-medium">Đã gửi lại mail xác thực.</span>
          ) : (
            <button className="font-medium text-primary underline" disabled={vm.isResending} onClick={vm.onResendVerify}>
              Gửi lại mail xác thực
            </button>
          )}
          {vm.resendError && <p className="text-destructive">{vm.resendError}</p>}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Email" value={vm.me.email} />
          <Row label="Tên" value={vm.me.name ?? '—'} />
          <Row label="Số dư" value={vm.balanceText} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link to="/nap-tien"><Button>Nạp xu</Button></Link>
        <Link to="/da-mua"><Button variant="outline">Video đã mua</Button></Link>
        <Link to="/lich-su"><Button variant="outline">Lịch sử xu</Button></Link>
        <Button variant="ghost" onClick={vm.onLogout}>Đăng xuất</Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
