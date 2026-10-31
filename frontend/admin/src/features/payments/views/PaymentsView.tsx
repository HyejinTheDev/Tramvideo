import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Spinner, Table, Td, Th, cn } from '@tram/ui';
import type { PaymentEventStatus } from '@tram/shared';
import { EmptyState, Pagination } from '@/components/common';
import { usePaymentsViewModel } from '../view-models/usePaymentsViewModel';

export function PaymentsView() {
  const vm = usePaymentsViewModel();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Đối soát nạp tiền ({vm.total})</h1>
        <Select value={vm.status} onChange={(e) => vm.onStatusChange(e.target.value as PaymentEventStatus | '')} className="w-44">
          <option value="">Tất cả</option>
          {vm.statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      {vm.resolving && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Xử lý khoản {vm.resolving.amount.toLocaleString('vi-VN')}đ – “{vm.resolving.content}”</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tìm người dùng (email, tên hoặc ID – tối thiểu 3 ký tự)</Label>
              <Input value={vm.userSearch} onChange={(e) => vm.onUserSearch(e.target.value)} />
              <div className="space-y-1">
                {vm.userOptions.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => vm.onSelectUser(u.id)}
                    className={cn('block w-full rounded border px-3 py-2 text-left text-sm hover:bg-accent', vm.selectedUserId === u.id && 'border-primary bg-primary/10')}
                  >
                    {u.email} {u.name ? `(${u.name})` : ''} – số dư {u.balance.toLocaleString('vi-VN')} xu
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Số xu cộng (theo số tiền thực nhận)</Label>
                <Input type="number" value={vm.amount} onChange={(e) => vm.onAmountChange(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Ghi chú (bắt buộc)</Label>
                <Input value={vm.note} onChange={(e) => vm.onNoteChange(e.target.value)} />
              </div>
            </div>
            {vm.resolveError && <Alert variant="destructive">{vm.resolveError}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button disabled={!vm.canCredit || vm.isSubmitting} onClick={vm.onCredit}>Cộng xu cho người đã chọn</Button>
              <Button variant="outline" disabled={vm.isSubmitting} onClick={vm.onIgnore}>Đánh dấu bỏ qua</Button>
              <Button variant="ghost" onClick={vm.onClose}>Đóng</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {vm.isLoading ? (
        <Spinner />
      ) : vm.rows.length === 0 ? (
        <EmptyState text="Không có khoản nào" />
      ) : (
        <Table>
          <thead>
            <tr><Th>Thời gian CK</Th><Th>Số tiền</Th><Th>Nội dung</Th><Th>Mã GD</Th><Th>Trạng thái</Th><Th /></tr>
          </thead>
          <tbody>
            {vm.rows.map((p) => (
              <tr key={p.id}>
                <Td className="whitespace-nowrap">{p.timeText}</Td>
                <Td className="whitespace-nowrap font-medium">{p.amountText}</Td>
                <Td className="max-w-xs truncate" title={p.content}>{p.content}</Td>
                <Td className="text-xs text-muted-foreground">{p.providerTxId}</Td>
                <Td><Badge variant={p.status === 'UNMATCHED' ? 'warning' : p.status === 'IGNORED' ? 'secondary' : 'success'}>{p.statusLabel}</Badge></Td>
                <Td className="text-right">
                  {p.canResolve && <Button size="sm" onClick={() => vm.onOpen(p)}>Xử lý</Button>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination {...vm} />
    </div>
  );
}
