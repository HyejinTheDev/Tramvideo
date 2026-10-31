import type { ReactNode } from 'react';
import { Alert } from '@tram/ui';
import NotFoundPage from './NotFoundPage';

/**
 * BẢN NHÁP các trang pháp lý bắt buộc (dan_y.md mục 18).
 * Chủ website cần điền thông tin thật và nên nhờ người có chuyên môn rà soát trước khi ra mắt.
 */
const PAGES: Record<string, { title: string; body: ReactNode }> = {
  'dieu-khoan': {
    title: 'Điều khoản sử dụng',
    body: (
      <>
        <h2>1. Tài khoản</h2>
        <p>Bạn chịu trách nhiệm bảo mật tài khoản và mọi hoạt động phát sinh từ tài khoản của mình.</p>
        <h2>2. Xu</h2>
        <p>
          Xu là đơn vị dùng để mua video trên Trạm Video (1 xu = 1đ). Xu <b>chỉ dùng để mua video trên website</b>,
          không quy đổi ngược ra tiền mặt, không chuyển nhượng cho tài khoản khác.
        </p>
        <h2>3. Quyền sử dụng video</h2>
        <p>
          Khi mua, bạn được cấp quyền sử dụng video theo phạm vi: [ĐIỀN PHẠM VI – cá nhân / thương mại, có được đăng lại mạng xã hội hay không].
          Không được bán lại hoặc phân phối lại file gốc.
        </p>
        <h2>4. Hành vi bị cấm</h2>
        <p>Chia sẻ tài khoản, dùng công cụ tự động tải hàng loạt, gian lận thanh toán. Vi phạm có thể bị khoá tài khoản.</p>
        <h2>5. Liên hệ</h2>
        <p>Mọi thắc mắc vui lòng xem trang Liên hệ.</p>
      </>
    ),
  },
  'chinh-sach-bao-mat': {
    title: 'Chính sách bảo mật',
    body: (
      <>
        <p>Chúng tôi chỉ thu thập email, tên hiển thị và lịch sử giao dịch cần thiết để cung cấp dịch vụ.</p>
        <p>Mật khẩu được mã hoá một chiều; chúng tôi không lưu thông tin thẻ/tài khoản ngân hàng của bạn.</p>
        <p>Bạn có thể yêu cầu xoá tài khoản và dữ liệu cá nhân bằng cách liên hệ: [ĐIỀN EMAIL HỖ TRỢ].</p>
      </>
    ),
  },
  'chinh-sach-hoan-tien': {
    title: 'Chính sách hoàn tiền',
    body: (
      <>
        <p>
          Hoàn xu được xem xét khi: file tải về bị lỗi không xem được, hoặc nội dung sai khác rõ rệt so với mô tả.
          [ĐIỀN THÊM ĐIỀU KIỆN VÀ THỜI HẠN YÊU CẦU, ví dụ trong 7 ngày kể từ khi mua].
        </p>
        <p>Xu được hoàn vào ví trên website, không hoàn ra tiền mặt.</p>
        <p>Chuyển khoản sai nội dung/số tiền: liên hệ hỗ trợ kèm ảnh biên lai để được cộng xu thủ công.</p>
      </>
    ),
  },
  'lien-he': {
    title: 'Liên hệ',
    body: (
      <>
        <p>Chủ sở hữu website: [ĐIỀN TÊN CÁ NHÂN / DOANH NGHIỆP]</p>
        <p>Mã số thuế / Số ĐKKD: [ĐIỀN]</p>
        <p>Địa chỉ: [ĐIỀN]</p>
        <p>Email hỗ trợ: [ĐIỀN] · Điện thoại/Zalo: [ĐIỀN]</p>
      </>
    ),
  },
};

export default function LegalPage({ slug }: { slug: string }) {
  const page = PAGES[slug];
  if (!page) return <NotFoundPage />;
  return (
    <article className="prose mx-auto max-w-3xl space-y-4 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      {import.meta.env.DEV && (
        <Alert>Bản nháp – cần điền các mục [ĐIỀN ...] và rà soát trước khi ra mắt.</Alert>
      )}
      {page.body}
    </article>
  );
}
