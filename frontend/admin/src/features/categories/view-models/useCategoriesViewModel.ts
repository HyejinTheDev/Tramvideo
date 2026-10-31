import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@tram/shared';
import { toMessage } from '@/lib/errorMessages';
import { categoriesApi, categoryQueries } from '../model/category.api';

interface Draft {
  id: string | null;
  name: string;
  slug: string;
  sortOrder: number;
}

const EMPTY: Draft = { id: null, name: '', slug: '', sortOrder: 0 };

export function useCategoriesViewModel() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(categoryQueries.list());
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });
  const save = useMutation({
    mutationFn: (d: Draft) => {
      const input = { name: d.name, slug: d.slug || undefined, sortOrder: d.sortOrder };
      return d.id ? categoriesApi.update(d.id, input) : categoriesApi.create(input);
    },
    onSuccess: () => {
      setDraft(EMPTY);
      void invalidate();
    },
  });
  const remove = useMutation({ mutationFn: categoriesApi.remove, onSuccess: () => void invalidate() });

  return {
    isLoading,
    categories: data ?? [],
    draft,
    isEditing: !!draft.id,
    isSaving: save.isPending,
    errorMessage: save.error ? toMessage(save.error) : remove.error ? toMessage(remove.error) : null,
    onDraftChange: (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })),
    onEdit: (c: Category) => setDraft({ id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder }),
    onCancel: () => setDraft(EMPTY),
    onSave: (e: React.FormEvent) => {
      e.preventDefault();
      if (draft.name.trim()) save.mutate(draft);
    },
    onDelete: (c: Category) => {
      if (window.confirm(`Xoá danh mục “${c.name}”?`)) remove.mutate(c.id);
    },
  };
}
