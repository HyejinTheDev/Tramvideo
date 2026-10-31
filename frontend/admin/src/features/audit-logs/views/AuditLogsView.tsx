import { Button, Spinner, Table, Td, Th } from '@tram/ui';
import { EmptyState, Pagination } from '@/components/common';
import { useAuditLogsViewModel } from '../view-models/useAuditLogsViewModel';

export function AuditLogsView() {
  const vm = useAuditLogsViewModel();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Nhật ký thao tác ({vm.total})</h1>
        {vm.filterText && (
          <Button size="sm" variant="outline" onClick={vm.onClearFilter}>Lọc: {vm.filterText} ✕</Button>
        )}
      </div>
      {vm.isLoading ? (
        <Spinner />
      ) : vm.rows.length === 0 ? (
        <EmptyState text="Chưa có nhật ký" />
      ) : (
        <Table>
          <thead>
            <tr><Th>Thời gian</Th><Th>Người thực hiện</Th><Th>Thao tác</Th><Th>Đối tượng</Th><Th>Chi tiết</Th></tr>
          </thead>
          <tbody>
            {vm.rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{r.timeText}</Td>
                <Td>{r.actor}</Td>
                <Td>{r.actionLabel}</Td>
                <Td className="text-xs text-muted-foreground">{r.target}</Td>
                <Td className="max-w-md truncate font-mono text-xs" title={r.dataText}>{r.dataText}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination {...vm} />
    </div>
  );
}
