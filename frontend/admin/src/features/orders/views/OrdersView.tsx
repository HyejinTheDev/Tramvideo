import { Alert, Badge, Button, Select, Spinner, Table, Td, Th } from '@tram/ui';
import { EmptyState, Pagination } from '@/components/common';
import { useOrdersViewModel } from '../view-models/useOrdersViewModel';

export function OrdersView() {
  const vm = useOrdersViewModel();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Đơn hàng ({vm.total})</h1>
        <Select value={vm.status} onChange={(e) => vm.onStatusChange(e.target.value as '' | 'COMPLETED' | 'REFUNDED')} className="w-44">
          <option value="">Tất cả</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="REFUNDED">Đã hoàn xu</option>
        </Select>
      </div>
      {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
      {vm.isLoading ? (
        <Spinner />
      ) : vm.rows.length === 0 ? (
        <EmptyState text="Chưa có đơn hàng" />
      ) : (
        <Table>
          <thead>
            <tr><Th>Thời gian</Th><Th>Khách</Th><Th>Video</Th><Th>Giá</Th><Th>Trạng thái</Th><Th /></tr>
          </thead>
          <tbody>
            {vm.rows.map((o) => (
              <tr key={o.id}>
                <Td className="whitespace-nowrap">{o.timeText}</Td>
                <Td>{o.userEmail}</Td>
                <Td>{o.videoTitle}</Td>
                <Td className="whitespace-nowrap">{o.priceText}</Td>
                <Td>
                  <Badge variant={o.status === 'COMPLETED' ? 'success' : 'secondary'}>
                    {o.status === 'COMPLETED' ? 'Hoàn tất' : 'Đã hoàn xu'}
                  </Badge>
                </Td>
                <Td className="text-right">
                  {o.canRefund && <Button size="sm" variant="outline" onClick={() => vm.onRefund(o)}>Hoàn xu</Button>}
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
