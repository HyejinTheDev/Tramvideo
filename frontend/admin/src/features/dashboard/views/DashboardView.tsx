import { Link } from 'react-router-dom';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Spinner, Table, Td, Th } from '@tram/ui';
import { useDashboardViewModel } from '../view-models/useDashboardViewModel';

export function DashboardView() {
  const vm = useDashboardViewModel();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <div className="flex gap-1">
          {vm.ranges.map((r) => (
            <Button key={r.value} size="sm" variant={vm.range === r.value ? 'default' : 'outline'} onClick={() => vm.onRangeChange(r.value)}>
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {vm.unmatchedPayments > 0 && (
        <Alert variant="destructive">
          Có <b>{vm.unmatchedPayments}</b> khoản nạp chưa khớp cần xử lý.{' '}
          <Link to="/nap-tien" className="underline">Xem ngay</Link>
        </Alert>
      )}

      {vm.isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {vm.cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold">{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Video bán chạy</CardTitle>
            </CardHeader>
            <CardContent>
              {vm.topVideos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có đơn trong khoảng thời gian này.</p>
              ) : (
                <Table>
                  <thead>
                    <tr><Th>Video</Th><Th className="text-right">Đã bán</Th><Th className="text-right">Doanh thu</Th></tr>
                  </thead>
                  <tbody>
                    {vm.topVideos.map((v) => (
                      <tr key={v.id}>
                        <Td><Link to={`/videos/${v.id}`} className="hover:underline">{v.title}</Link></Td>
                        <Td className="text-right">{v.sold}</Td>
                        <Td className="text-right">{v.revenueText}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
