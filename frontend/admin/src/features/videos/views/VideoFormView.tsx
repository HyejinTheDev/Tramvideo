import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Spinner, Textarea } from '@tram/ui';
import { useVideoFormViewModel } from '../view-models/useVideoFormViewModel';
import { STATUS_LABEL } from '../view-models/useVideoListViewModel';
import { VideoUploadPanel } from './VideoUploadPanel';

export function VideoFormView({ id }: { id?: string }) {
  const vm = useVideoFormViewModel(id);
  if (vm.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/videos" className="text-sm text-muted-foreground hover:underline">← Danh sách</Link>
        <h1 className="text-2xl font-bold">{vm.isEdit ? 'Sửa video' : 'Thêm video'}</h1>
        {vm.video && <Badge variant="outline">{STATUS_LABEL[vm.video.status]}</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader><CardTitle>Thông tin</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={vm.onSubmit} className="space-y-4" noValidate>
              <Field label="Tiêu đề" error={vm.errors.title?.message}>
                <Input {...vm.register('title')} />
              </Field>
              <Field label="Slug (để trống = tự tạo từ tiêu đề)" error={vm.errors.slug?.message}>
                <Input {...vm.register('slug')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Giá (xu)" error={vm.errors.price?.message}>
                  <Input type="number" step={1000} {...vm.register('price')} />
                </Field>
                <Field label="Thời lượng (giây)" error={vm.errors.durationSec?.message}>
                  <Input type="number" {...vm.register('durationSec')} />
                </Field>
              </div>
              <Field label="Danh mục" error={vm.errors.categoryId?.message}>
                <Select {...vm.register('categoryId')}>
                  <option value="">— Chọn —</option>
                  {vm.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Mô tả">
                <Textarea rows={5} {...vm.register('description')} />
              </Field>
              <Field label="Tag (cách nhau dấu phẩy)">
                <Input {...vm.register('tagsText')} placeholder="tổng tài, ngôn tình" />
              </Field>
              {vm.errorMessage && <Alert variant="destructive">{vm.errorMessage}</Alert>}
              {vm.saved && <Alert variant="success">Đã lưu.</Alert>}
              <Button type="submit" disabled={vm.isSaving}>
                {vm.isSaving ? 'Đang lưu...' : vm.isEdit ? 'Lưu thay đổi' : 'Tạo bản nháp & tiếp tục upload'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {vm.video ? (
          <VideoUploadPanel video={vm.video} />
        ) : (
          <Card><CardContent className="pt-6 text-sm text-muted-foreground">Tạo bản nháp trước, sau đó upload file gốc, preview và ảnh bìa.</CardContent></Card>
        )}
      </div>
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
