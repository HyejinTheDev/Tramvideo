# Trạm Video

Website bán video ngắn: khách xem preview có watermark, nạp xu bằng QR chuyển khoản (SePay), mua bằng xu và tải file gốc qua link có hạn.

Kiến trúc chi tiết: [`../dan_y.md`](../dan_y.md). Monorepo **Turborepo + pnpm** · Backend **NestJS + Clean Architecture** · Frontend **React (Vite) + MVVM** · **Prisma + PostgreSQL** · **Cloudflare R2**.

## Cấu trúc

```
frontend/web     React SPA – trang khách        (http://localhost:5173)
frontend/admin   React SPA – trang quản trị     (http://localhost:5174)
frontend/ui      Component dùng chung web + admin
backend/api      NestJS API                     (http://localhost:3000/v1)
backend/database Prisma schema, migration, seed
backend/worker   Xử lý video nền (giai đoạn sau)
packages/shared  Zod schema, type, mã lỗi – "hợp đồng" FE ↔ BE
packages/config  tsconfig dùng chung
```

## Chạy lần đầu

Cần: Node ≥ 20, pnpm 9 (`npm i -g pnpm@9`), Docker Desktop.

```bash
pnpm install
cp .env.example .env            # đã có sẵn giá trị dev
pnpm db:up                      # Postgres (cổng 5433) + Redis
pnpm --filter @tram/shared build
pnpm db:migrate                 # tạo bảng
pnpm db:seed                    # dữ liệu mẫu
pnpm dev                        # chạy api + web + admin cùng lúc
```

Tài khoản mẫu (sau `pnpm db:seed`):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@tramvideo.local | Admin@12345 |
| Khách (ví 100.000 xu) | khach@tramvideo.local | Khach@12345 |

> Postgres của dự án dùng cổng **5433** để không đụng Postgres cài sẵn trên máy (5432).

### Chạy dev khi chưa có R2 / SePay / Resend

- **R2 chưa cấu hình** → API tự chuyển sang chế độ giả lập: upload vào `/dev-upload/*` (bỏ file), tải về nhận file `.txt` giả. Đủ để chạy thử trọn luồng upload → đăng → mua → tải.
- **Resend chưa cấu hình** → mail (xác thực, quên mật khẩu) in ra log của API.
- **Giả lập SePay báo có** (thay `TVXXXXXX` bằng mã nạp hiện trên màn hình QR):

```bash
curl -X POST http://localhost:3000/v1/webhooks/sepay \
  -H "Authorization: Apikey change-me-sepay-key" -H "Content-Type: application/json" \
  -d '{"id":123456,"transactionDate":"2026-10-31 10:00:00","content":"CK TVXXXXXX","transferType":"in","transferAmount":50000}'
```

## Lệnh thường dùng

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy tất cả ở chế độ dev |
| `pnpm lint` | ESLint (có luật chặn import sai tầng) |
| `pnpm typecheck` | Kiểm tra kiểu toàn repo |
| `pnpm test` | Unit test |
| `pnpm test:int` | Integration test với Postgres thật (DB `tram_video_test`) |
| `pnpm build` | Build tất cả |
| `pnpm db:studio` | Xem dữ liệu bằng Prisma Studio |

## Quy tắc quan trọng

- `frontend/*` **không bao giờ** import `backend/*` hay `@tram/database` – ESLint chặn.
- View/Page FE không gọi API hay `useQuery` trực tiếp – đi qua ViewModel (`use…ViewModel`) – ESLint chặn.
- Domain BE không phụ thuộc NestJS/Prisma/SDK – ESLint chặn.
- Tiền luôn là **số nguyên** (xu = VND). Mọi biến động xu ghi vào sổ cái `WalletTransaction`, không sửa/xoá.
- Tên file: FE theo kiểu React (`VideoDetailView.tsx`, `useVideoDetailViewModel.ts`), BE theo kebab-case NestJS (`purchase-video.use-case.ts`).

## Cấu hình thật trước khi ra mắt

1. **R2**: tạo 2 bucket (`tram-video-private`, `tram-video-public`), gắn domain `cdn.tramvideo.vn` cho bucket public, cấu hình CORS cho phép `admin.tramvideo.vn` gọi `PUT`. Điền `R2_*` trong `.env`.
2. **SePay**: đăng ký, liên kết tài khoản ngân hàng, tạo webhook trỏ về `https://api.tramvideo.vn/v1/webhooks/sepay` với kiểu xác thực API Key. Điền `SEPAY_WEBHOOK_API_KEY`, `BANK_*`.
3. **Google OAuth**: tạo OAuth Client, redirect URI `https://api.tramvideo.vn/v1/auth/google/callback`. Điền `GOOGLE_CLIENT_*`.
4. **Resend**: xác thực domain gửi mail, điền `RESEND_API_KEY`.
5. Đổi `JWT_*_SECRET` thành chuỗi ngẫu nhiên dài; `COOKIE_DOMAIN=.tramvideo.vn`.
6. Điền các mục `[ĐIỀN ...]` trong trang pháp lý (`frontend/web/src/pages/LegalPage.tsx`).

## Deploy

- `web`, `admin`: Cloudflare Pages (build `pnpm --filter @tram/web build`, thư mục `frontend/web/dist`; cấu hình SPA fallback về `index.html`).
- `api`: build image `docker build -f docker/api.Dockerfile -t tram-api .`, chạy bằng `docker-compose.prod.yml` trên VPS (Caddy tự cấp SSL). Production chỉ dùng `prisma migrate deploy`.
