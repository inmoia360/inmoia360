import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DELAGALA Consultoría Inmobiliaria',
  description: 'Un café gratis por cortesía de DELAGALA. Regístrate y recibe tu código por WhatsApp.',
};

export default function DailyCoffeeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
