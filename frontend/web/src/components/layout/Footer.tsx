import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Trạm Video. Xu chỉ dùng để mua video trên website.</p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/dieu-khoan" className="hover:underline">Điều khoản</Link>
          <Link to="/chinh-sach-bao-mat" className="hover:underline">Bảo mật</Link>
          <Link to="/chinh-sach-hoan-tien" className="hover:underline">Hoàn tiền</Link>
          <Link to="/lien-he" className="hover:underline">Liên hệ</Link>
        </nav>
      </div>
    </footer>
  );
}
