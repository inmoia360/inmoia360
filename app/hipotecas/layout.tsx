import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crédito Claro · Intermediación hipotecaria sin coste',
  description:
    'Comparamos y negociamos tu hipoteca con más de 20 entidades. Estudio gratis y sin compromiso. Calcula tu cuota al instante.',
};

export default function HipotecasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
