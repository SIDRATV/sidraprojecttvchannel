import { AppLayout } from '@/components/app/AppLayout';

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
