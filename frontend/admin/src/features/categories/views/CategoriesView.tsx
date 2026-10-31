import { Alert, Button, Card, CardContent, Input, Label, Spinner, Table, Td, Th } from '@tram/ui';
import { useCategoriesViewModel } from '../view-models/useCategoriesViewModel';

export function CategoriesView() {
  const vm = useCategoriesViewModel();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Danh mục</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={vm.onSave} className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label>Tên</Label>
              <Input value={vm.draft.name} onChange={(e) => vm.onDraftChange({ name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (để trống = tự tạo)</Label>
              <Input value={vm.draft.slug} onChange={(e) => vm.onDraftChange({ slug: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Thứ tự</Label>
              <Input type="number" value={vm.draft.sortOrder} onChange={(e) => vm.onDraftChange({ sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={vm.isSaving}>{vm.isEditing ? 'Lưu' : 'Thêm'}</Button>
              {vm.isEditing && <Button type="button" variant="ghost" onClick={vm.onCancel}>Huỷ</Button>}
            </div>
          </form>
          {vm.errorMessage && <Alert variant="destructive" className="mt-3">{vm.errorMessage}</Alert>}
        </CardContent>
      </Card>

      {vm.isLoading ? (
        <Spinner />
      ) : (
        <Table>
          <thead>
            <tr><Th>Tên</Th><Th>Slug</Th><Th>Thứ tự</Th><Th /></tr>
          </thead>
          <tbody>
            {vm.categories.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.name}</Td>
                <Td className="text-muted-foreground">{c.slug}</Td>
                <Td>{c.sortOrder}</Td>
                <Td className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => vm.onEdit(c)}>Sửa</Button>
                  <Button size="sm" variant="ghost" onClick={() => vm.onDelete(c)}>Xoá</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
