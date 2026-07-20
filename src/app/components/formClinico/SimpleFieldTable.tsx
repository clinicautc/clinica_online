import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export interface SimpleFieldColumn {
  label: string;
  name: (row: number) => string;
  type?: 'text' | 'textarea' | 'date';
  maxLength?: number;
}

interface SimpleFieldTableProps {
  numRows: number;
  columns: SimpleFieldColumn[];
  formData: Record<string, string | boolean>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Exclusivo de Seguimiento Nutricional: fila (1-6) que corresponde a la
   * consulta en curso. Si se pasa, las demás filas quedan en solo lectura
   * (mismo criterio que `columnaActual` en MatrixTable, aquí el eje de
   * consulta es la fila en vez de la columna). Si se omite, comportamiento
   * idéntico al de siempre.
   */
  filaActual?: number;
}

/**
 * Tabla de filas repetidas con columnas de significado fijo (no fechas por
 * columna) — patrón de "Diagnóstico Matriz / Interpretación antropométrica"
 * e "Interpretación bioquímica" en el documento institucional.
 */
export default function SimpleFieldTable({ numRows, columns, formData, onChange, onDateChange, filaActual }: SimpleFieldTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(col => <TableHead key={col.label}>{col.label}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: numRows }, (_, i) => i + 1).map(row => {
          const bloqueada = filaActual != null && row !== filaActual;
          const claseBloqueada = bloqueada ? ' bg-slate-100 text-slate-400 cursor-not-allowed' : '';
          return (
            <TableRow key={row}>
              {columns.map(col => {
                const name = col.name(row);
                const value = (formData[name] as string) || '';
                return (
                  <TableCell key={col.label} className="whitespace-normal align-top">
                    {col.type === 'textarea' ? (
                      <Textarea name={name} value={value} onChange={onChange} readOnly={bloqueada} maxLength={col.maxLength} className={`min-h-16 text-xs${claseBloqueada}`} />
                    ) : col.type === 'date' ? (
                      <Input type="text" name={name} value={value} onChange={onDateChange} readOnly={bloqueada} maxLength={10} placeholder="DD/MM/AAAA" className={`h-8 text-xs${claseBloqueada}`} />
                    ) : (
                      <Input type="text" name={name} value={value} onChange={onChange} readOnly={bloqueada} maxLength={col.maxLength} className={`h-8 text-xs${claseBloqueada}`} />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
