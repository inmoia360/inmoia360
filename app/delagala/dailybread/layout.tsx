import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DELAGALA Consultoría Inmobiliaria · Pan',
  description: 'Un pan gratis por cortesía de DELAGALA. Regístrate y recibe tu código por WhatsApp.',
};

export default function DailyBreadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
