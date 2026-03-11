import { ExploreNavBar } from '@/components/app/ExploreNavBar';

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ExploreNavBar />
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
    </>
  );
}
