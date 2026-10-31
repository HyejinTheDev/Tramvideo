import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Spinner } from '@tram/ui';
import {
  useForgotPasswordViewModel,
  useLoginViewModel,
  useRegisterViewModel,
  useResetPasswordViewModel,
  useVerifyEmailViewModel,
} from '../view-models/useAuthFormsViewModel';

function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function GoogleButton({ href }: { href: string }) {
  return (
    <>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> hoặc <div className="h-px flex-1 bg-border" />
      </div>
      <a href={href}>
        <Button type="button" variant="outline" className="w-full">Tiếp tục với Google</Button>
      </a>
    </>
  );
}

export function LoginView() {
  const vm = useLoginViewModel();
  return (
    <AuthCard title="Đăng nhập">
      <form onSubmit={vm.onSubmit} className="space-y-4" noValidate>
        <Field label="Email" error={vm.errors.email?.message}>
          <Input type="email" autoComplete="email" {...vm.register('email')} />
        </Field>
        <Field label="Mật khẩu" error={vm.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...vm.register('password')} />
        </Field>
        {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
        <Button type="submit" className="w-full" disabled={vm.isSubmitting}>
          {vm.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
      <GoogleButton href={vm.googleUrl} />
      <div className="mt-4 flex justify-between text-sm">
        <Link to="/quen-mat-khau" className="text-muted-foreground hover:underline">Quên mật khẩu?</Link>
        <Link to="/dang-ky" className="text-primary hover:underline">Tạo tài khoản</Link>
      </div>
    </AuthCard>
  );
}

export function RegisterView() {
  const vm = useRegisterViewModel();
  return (
    <AuthCard title="Đăng ký">
      <form onSubmit={vm.onSubmit} className="space-y-4" noValidate>
        <Field label="Tên hiển thị (không bắt buộc)" error={vm.errors.name?.message}>
          <Input autoComplete="name" {...vm.register('name', { setValueAs: (v: string) => v || undefined })} />
        </Field>
        <Field label="Email" error={vm.errors.email?.message}>
          <Input type="email" autoComplete="email" {...vm.register('email')} />
        </Field>
        <Field label="Mật khẩu" error={vm.errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...vm.register('password')} />
        </Field>
        <Field label="Nhập lại mật khẩu" error={vm.errors.confirmPassword?.message}>
          <Input type="password" autoComplete="new-password" {...vm.register('confirmPassword')} />
        </Field>
        {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
        <Button type="submit" className="w-full" disabled={vm.isSubmitting}>
          {vm.isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Bằng việc đăng ký, bạn đồng ý với <Link to="/dieu-khoan" className="underline">Điều khoản sử dụng</Link>.
        </p>
      </form>
      <GoogleButton href={vm.googleUrl} />
      <p className="mt-4 text-center text-sm">
        Đã có tài khoản? <Link to="/dang-nhap" className="text-primary hover:underline">Đăng nhập</Link>
      </p>
    </AuthCard>
  );
}

export function ForgotPasswordView() {
  const vm = useForgotPasswordViewModel();
  return (
    <AuthCard title="Quên mật khẩu">
      {vm.isSent ? (
        <Alert variant="success">
          Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (cả mục Spam).
        </Alert>
      ) : (
        <form onSubmit={vm.onSubmit} className="space-y-4" noValidate>
          <Field label="Email đã đăng ký" error={vm.errors.email?.message}>
            <Input type="email" {...vm.register('email')} />
          </Field>
          {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
          <Button type="submit" className="w-full" disabled={vm.isSubmitting}>Gửi liên kết</Button>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordView({ token }: { token: string | null }) {
  const vm = useResetPasswordViewModel(token);
  if (!vm.hasToken) return <AuthCard title="Đặt lại mật khẩu"><Alert variant="destructive">Liên kết không hợp lệ.</Alert></AuthCard>;
  return (
    <AuthCard title="Đặt lại mật khẩu">
      {vm.isDone ? (
        <div className="space-y-4">
          <Alert variant="success">Đã đổi mật khẩu. Mọi thiết bị đã được đăng xuất.</Alert>
          <Link to="/dang-nhap"><Button className="w-full">Đăng nhập</Button></Link>
        </div>
      ) : (
        <form onSubmit={vm.onSubmit} className="space-y-4" noValidate>
          <Field label="Mật khẩu mới" error={vm.errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...vm.register('password')} />
          </Field>
          <Field label="Nhập lại mật khẩu" error={vm.errors.confirmPassword?.message}>
            <Input type="password" autoComplete="new-password" {...vm.register('confirmPassword')} />
          </Field>
          {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
          <Button type="submit" className="w-full" disabled={vm.isSubmitting}>Đổi mật khẩu</Button>
        </form>
      )}
    </AuthCard>
  );
}

export function VerifyEmailView({ token }: { token: string | null }) {
  const vm = useVerifyEmailViewModel(token);
  return (
    <AuthCard title="Xác thực email">
      {vm.state === 'loading' && <Spinner />}
      {vm.state === 'ok' && (
        <div className="space-y-4">
          <Alert variant="success">Email đã được xác thực. Cảm ơn bạn!</Alert>
          <Link to="/"><Button className="w-full">Về trang chủ</Button></Link>
        </div>
      )}
      {vm.state === 'error' && <Alert variant="destructive">{vm.message}</Alert>}
    </AuthCard>
  );
}
