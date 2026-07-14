import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export interface SimpleFieldColumn {
  label: string;
  name: (row: number) => string;
  type?: 'text' | 'textarea' | 'date';
}

interface SimpleFieldTableProps {
  numRows: number;
  columns: SimpleFieldColumn[];
  formData: Record<string, string | boolean>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Tabla de filas repetidas con columnas de significado fijo (no fechas por
 * columna) — patrón de "Diagnóstico Matriz / Interpretación antropométrica"
 * e "Interpretación bioquímica" en el documento institucional.
 */
export default function SimpleFieldTable({ numRows, columns, formData, onChange, onDateChange }: SimpleFieldTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(col => <TableHead key={col.label}>{col.label}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: numRows }, (_, i) => i + 1).map(row => (
          <TableRow key={row}>
            {columns.map(col => {
              const name = col.name(row);
              const value = (formData[name] as string) || '';
              return (
                <TableCell key={col.label} className="whitespace-normal align-top">
                  {col.type === 'textarea' ? (
                    <Textarea name={name} value={value} onChange={onChange} className="min-h-16 text-xs" />
                  ) : col.type === 'date' ? (
                    <Input type="text" name={name} value={value} onChange={onDateChange} maxLength={10} placeholder="DD/MM/AAAA" className="h-8 text-xs" />
                  ) : (
                    <Input type="text" name={name} value={value} onChange={onChange} className="h-8 text-xs" />
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
