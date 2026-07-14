import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface FormSectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function FormSectionCard({ title, description, children, className }: FormSectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-blue-900">{title}</CardTitle>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
