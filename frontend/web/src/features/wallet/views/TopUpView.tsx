import { Link } from 'react-router-dom';
import { Alert, Button, Card, CardContent, Input, Label, cn } from '@tram/ui';
import { formatVnd } from '@tram/shared';
import { useTopUpViewModel } from '../view-models/useTopUpViewModel';

export function TopUpView() {
  const vm = useTopUpViewModel();

  if (vm.topUp) {
    const t = vm.topUp;
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Quét mã để nạp {formatVnd(t.amount)}</h1>

        {vm.status === 'COMPLETED' ? (
          <Card>
            <CardContent className="space-y-4 pt-6 text-center">
              <div className="text-5xl">🎉</div>
              <p className="text-lg font-semibold">Nạp thành công {formatVnd(t.amount)}!</p>
              <div className="flex justify-center gap-2">
                {vm.backUrl && <Link to={vm.backUrl}><Button>Quay lại video</Button></Link>}
                <Link to="/"><Button variant="outline">Xem video</Button></Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <img src={t.qrUrl} alt="Mã QR chuyển khoản" className="mx-auto w-64 rounded-lg border bg-white p-2" />
              <dl className="space-y-2 text-sm">
                <InfoRow label="Ngân hàng" value={t.bankCode} />
                <InfoRow label="Số tài khoản" value={t.bankAccountNo} onCopy={() => vm.copy(t.bankAccountNo)} />
                <InfoRow label="Chủ tài khoản" value={t.bankAccountName} />
                <InfoRow label="Số tiền" value={formatVnd(t.amount).replace(' xu', 'đ')} onCopy={() => vm.copy(String(t.amount))} />
                <InfoRow label="Nội dung" value={t.code} highlight onCopy={() => vm.copy(t.code)} />
              </dl>
              <Alert>
                ⚠️ Nhập <b>đúng nội dung {t.code}</b> và <b>đúng số tiền</b> để được cộng xu tự động.
              </Alert>
              {vm.status === 'PENDING' ? (
                <p className="text-center text-sm text-muted-foreground">
                  <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Đang chờ thanh toán... (mã hiệu lực {vm.countdownText})
                </p>
              ) : (
                <Alert variant="destructive">
                  Mã QR đã hết hạn. Nếu bạn đã chuyển khoản đúng nội dung, xu vẫn sẽ được cộng; nếu chưa, hãy tạo mã mới.
                </Alert>
              )}
              <Button variant="ghost" className="w-full" onClick={vm.onReset}>Tạo mã khác</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Nạp xu</h1>
      <p className="text-sm text-muted-foreground">1 xu = 1đ. Xu dùng để mua video, không quy đổi ngược ra tiền.</p>

      <div className="grid grid-cols-2 gap-3">
        {vm.presets.map((p) => (
          <button
            key={p.value}
            onClick={() => vm.onAmountChange(p.value)}
            className={cn(
              'rounded-lg border p-4 text-lg font-semibold transition-colors hover:border-primary',
              vm.amount === p.value && 'border-primary bg-primary/10 text-primary',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label>Hoặc nhập số xu khác</Label>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          value={vm.amount || ''}
          onChange={(e) => vm.onAmountChange(Number(e.target.value))}
        />
        {!vm.validAmount && <p className="text-sm text-destructive">Nạp tối thiểu {vm.minText}</p>}
      </div>

      {vm.createError && <Alert variant="destructive">{vm.createError}</Alert>}

      <Button size="lg" className="w-full" disabled={!vm.validAmount || vm.isCreating} onClick={vm.onCreate}>
        {vm.isCreating ? 'Đang tạo mã...' : `Tạo mã QR nạp ${vm.amountText}`}
      </Button>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
  onCopy,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('flex items-center gap-2 font-medium', highlight && 'text-lg text-primary')}>
        {value || '—'}
        {onCopy && value && (
          <button onClick={onCopy} className="text-xs text-muted-foreground hover:text-foreground" title="Sao chép">
            📋
          </button>
        )}
      </dd>
    </div>
  );
}
