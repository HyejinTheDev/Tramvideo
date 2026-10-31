import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toMessage } from '@/lib/errorMessages';
import { categoryQueries } from '../../categories/model/category.api';
import { videoQueries, videosApi } from '../model/video.api';

/** Form nhập liệu thân thiện (giá, thời lượng nhập số; tag nhập chuỗi cách nhau dấu phẩy). */
const formSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề').max(200),
  slug: z.string().trim().max(200).optional(),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().int('Giá phải là số nguyên').min(0),
  durationSec: z.coerce.number().int().min(0),
  categoryId: z.string().min(1, 'Chọn danh mục'),
  tagsText: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

function toInput(v: FormValues) {
  return {
    title: v.title,
    slug: v.slug || undefined,
    description: v.description ?? '',
    price: v.price,
    durationSec: v.durationSec,
    categoryId: v.categoryId,
    tags: (v.tagsText ?? '').split(',').map((t) => t.trim()).filter(Boolean),
  };
}

/** Dùng cho cả tạo mới (id = undefined) và sửa. */
export function useVideoFormViewModel(id?: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useQuery(categoryQueries.list());
  const video = useQuery({ ...videoQueries.one(id ?? ''), enabled: !!id });
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { price: 10000, durationSec: 30 } });

  useEffect(() => {
    const v = video.data;
    if (v) {
      form.reset({
        title: v.title,
        slug: v.slug,
        description: v.description ?? '',
        price: v.price,
        durationSec: v.durationSec,
        categoryId: v.categoryId,
        tagsText: v.tags.join(', '),
      });
    }
  }, [video.data, form]);

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const input = toInput(values);
      if (id) {
        await videosApi.update(id, input);
        return id;
      }
      return (await videosApi.create(input)).id;
    },
    onSuccess: (savedId) => {
      void queryClient.invalidateQueries({ queryKey: ['videos'] });
      if (!id) navigate(`/videos/${savedId}`, { replace: true });
    },
  });

  return {
    isEdit: !!id,
    isLoading: !!id && video.isLoading,
    video: video.data,
    categories: categories.data ?? [],
    register: form.register,
    errors: form.formState.errors,
    isSaving: save.isPending,
    saved: save.isSuccess && !!id,
    errorMessage: save.error ? toMessage(save.error) : null,
    onSubmit: form.handleSubmit((v) => save.mutate(v)),
  };
}
