import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DELAGALA · Tu hipoteca negociada por expertos',
  description:
    'Servicio de intermediación hipotecaria de DELAGALA Consultoría Inmobiliaria. Analizamos, comparamos y negociamos tu hipoteca. Estudio gratis y sin compromiso.',
};

export default function DelagalaHipotecasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
