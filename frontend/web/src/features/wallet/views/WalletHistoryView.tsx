import { Link } from 'react-router-dom';
import { Button, Spinner, Table, Td, Th, cn } from '@tram/ui';
import { EmptyState, Pagination } from '@/components/common';
import { useWalletHistoryViewModel } from '../view-models/useWalletHistoryViewModel';

export function WalletHistoryView() {
  const vm = useWalletHistoryViewModel();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch sử xu</h1>
          <p className="text-sm text-muted-foreground">Số dư hiện tại: {vm.balanceText}</p>
        </div>
        <Link to="/nap-tien"><Button>Nạp xu</Button></Link>
      </div>

      {vm.isLoading ? (
        <Spinner />
      ) : vm.rows.length === 0 ? (
        <EmptyState text="Chưa có giao dịch nào" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Thời gian</Th>
              <Th>Loại</Th>
              <Th className="text-right">Số xu</Th>
              <Th className="text-right">Số dư sau</Th>
              <Th>Ghi chú</Th>
            </tr>
          </thead>
          <tbody>
            {vm.rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{r.timeText}</Td>
                <Td>{r.typeLabel}</Td>
                <Td className={cn('text-right font-medium', r.isCredit ? 'text-emerald-600' : 'text-destructive')}>
                  {r.amountText}
                </Td>
                <Td className="text-right">{r.balanceAfterText}</Td>
                <Td className="text-muted-foreground">{r.note ?? ''}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination {...vm} />
    </div>
  );
}
