import { NavLink } from 'react-router-dom';
import { Button, cn } from '@tram/ui';
import { useAdminShellViewModel } from '@/features/auth/view-models/useAdminAuthViewModel';

const NAV = [
  { to: '/', label: '📊 Tổng quan', end: true },
  { to: '/videos', label: '🎬 Video' },
  { to: '/danh-muc', label: '🗂️ Danh mục' },
  { to: '/don-hang', label: '🧾 Đơn hàng' },
  { to: '/nap-tien', label: '💳 Đối soát nạp' },
  { to: '/nguoi-dung', label: '👤 Người dùng' },
  { to: '/nhat-ky', label: '📜 Nhật ký' },
];

export function Sidebar() {
  const vm = useAdminShellViewModel();
  return (
    <aside className="flex w-full flex-col border-b bg-card md:min-h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="p-4 text-lg font-bold text-primary">Trạm Video</div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn('whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-accent', isActive && 'bg-accent font-medium')
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto hidden space-y-2 border-t p-4 text-xs text-muted-foreground md:block">
        <p className="truncate">{vm.email}</p>
        <Button size="sm" variant="outline" className="w-full" onClick={vm.onLogout}>Đăng xuất</Button>
      </div>
    </aside>
  );
}
