import { Link } from 'react-router-dom';
import { Button } from '@tram/ui';
import { useHomeViewModel } from '../view-models/useHomeViewModel';
import { VideoGrid } from './components/VideoCard';

export function HomeView() {
  const vm = useHomeViewModel();

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary px-6 py-10 text-primary-foreground">
        <h1 className="text-3xl font-bold md:text-4xl">Video ngắn chất lượng cao, tải về dùng ngay</h1>
        <p className="mt-3 max-w-xl opacity-90">
          Xem thử miễn phí, nạp xu bằng QR chuyển khoản trong vài giây, mua một lần tải lại nhiều lần.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {vm.categories.map((c) => (
            <Link key={c.slug} to={`/danh-muc/${c.slug}`}>
              <Button variant="secondary" size="sm">{c.name}</Button>
            </Link>
          ))}
        </div>
      </section>

      <Section title="🔥 Bán chạy" moreTo="/tim-kiem?sap-xep=bestselling">
        <VideoGrid videos={vm.bestselling} isLoading={vm.isLoading} />
      </Section>

      <Section title="🆕 Mới nhất" moreTo="/tim-kiem?sap-xep=newest">
        <VideoGrid videos={vm.newest} isLoading={vm.isLoading} />
      </Section>
    </div>
  );
}

function Section({ title, moreTo, children }: { title: string; moreTo: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link to={moreTo} className="text-sm text-primary hover:underline">Xem tất cả →</Link>
      </div>
      {children}
    </section>
  );
}
