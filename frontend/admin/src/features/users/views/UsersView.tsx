import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Input, Spinner, Table, Td, Th } from '@tram/ui';
import { EmptyState, Pagination } from '@/components/common';
import { useUsersViewModel } from '../view-models/useUsersViewModel';

export function UsersView() {
  const vm = useUsersViewModel();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Người dùng ({vm.total})</h1>
        <form onSubmit={vm.onSearch} className="flex gap-2">
          <Input placeholder="Email, tên hoặc ID" value={vm.q} onChange={(e) => vm.onQChange(e.target.value)} className="w-64" />
          <Button type="submit" variant="outline">Tìm</Button>
        </form>
      </div>
      {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
      {vm.isLoading ? (
        <Spinner />
      ) : vm.rows.length === 0 ? (
        <EmptyState text="Không tìm thấy người dùng" />
      ) : (
        <Table>
          <thead>
            <tr><Th>Email</Th><Th>Tên</Th><Th>Vai trò</Th><Th className="text-right">Số dư</Th><Th>Ngày tạo</Th><Th>Trạng thái</Th><Th /></tr>
          </thead>
          <tbody>
            {vm.rows.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium">{u.email}</Td>
                <Td>{u.name ?? '—'}</Td>
                <Td>{u.role === 'ADMIN' ? <Badge>Admin</Badge> : 'Khách'}</Td>
                <Td className="whitespace-nowrap text-right">{u.balanceText}</Td>
                <Td>{u.dateText}</Td>
                <Td>{u.isLocked ? <Badge variant="destructive">Đã khoá</Badge> : <Badge variant="success">Hoạt động</Badge>}</Td>
                <Td className="space-x-1 whitespace-nowrap text-right">
                  <Button size="sm" variant="outline" onClick={() => vm.onAdjust(u)}>± Xu</Button>
                  <Button size="sm" variant="ghost" onClick={() => vm.onToggleLock(u)}>{u.isLocked ? 'Mở khoá' : 'Khoá'}</Button>
                  <Link to={`/nhat-ky?targetType=user&targetId=${u.id}`} className="text-xs text-muted-foreground hover:underline">Nhật ký</Link>
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
