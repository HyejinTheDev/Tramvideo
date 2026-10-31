import { Link, NavLink } from 'react-router-dom';
import { Button, Input, cn } from '@tram/ui';
import { useHeaderViewModel } from './useHeaderViewModel';

export function Header() {
  const vm = useHeaderViewModel();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="shrink-0 text-xl font-bold text-primary" onClick={vm.onCloseMenu}>
          🎬 Trạm Video
        </Link>

        <form onSubmit={vm.onSearch} className="hidden flex-1 md:block">
          <Input
            type="search"
            placeholder="Tìm video: tổng tài, quay xe..."
            value={vm.keyword}
            onChange={(e) => vm.onKeywordChange(e.target.value)}
            className="max-w-md"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          {vm.isLoggedIn ? (
            <>
              <Link to="/nap-tien">
                <Button variant="outline" size="sm" title="Nạp thêm xu">
                  💰 {vm.balanceText || '…'}
                </Button>
              </Link>
              <Link to="/tai-khoan" className="hidden text-sm font-medium hover:underline sm:block">
                {vm.displayName}
              </Link>
            </>
          ) : (
            <>
              <Link to="/dang-nhap">
                <Button variant="ghost" size="sm">Đăng nhập</Button>
              </Link>
              <Link to="/dang-ky" className="hidden sm:block">
                <Button size="sm">Đăng ký</Button>
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={vm.onToggleMenu} aria-label="Menu">
            ☰
          </Button>
        </div>
      </div>

      <nav className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2 md:flex">
        <CategoryLinks categories={vm.categories} />
        {vm.isLoggedIn && (
          <>
            <NavItem to="/da-mua">Video đã mua</NavItem>
            <NavItem to="/lich-su">Lịch sử xu</NavItem>
          </>
        )}
      </nav>

      {vm.menuOpen && (
        <div className="space-y-3 border-t px-4 py-3 md:hidden" onClick={vm.onCloseMenu}>
          <form onSubmit={vm.onSearch} onClick={(e) => e.stopPropagation()}>
            <Input
              type="search"
              placeholder="Tìm video..."
              value={vm.keyword}
              onChange={(e) => vm.onKeywordChange(e.target.value)}
            />
          </form>
          <div className="flex flex-col gap-1">
            <CategoryLinks categories={vm.categories} />
            {vm.isLoggedIn ? (
              <>
                <NavItem to="/da-mua">Video đã mua</NavItem>
                <NavItem to="/lich-su">Lịch sử xu</NavItem>
                <NavItem to="/tai-khoan">Tài khoản</NavItem>
              </>
            ) : (
              <NavItem to="/dang-ky">Đăng ký</NavItem>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function CategoryLinks({ categories }: { categories: { slug: string; name: string }[] }) {
  return (
    <>
      {categories.map((c) => (
        <NavItem key={c.slug} to={`/danh-muc/${c.slug}`}>
          {c.name}
        </NavItem>
      ))}
    </>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground',
          isActive && 'bg-accent font-medium text-foreground',
        )
      }
    >
      {children}
    </NavLink>
  );
}
