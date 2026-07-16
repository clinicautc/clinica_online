import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

export interface VoInterpRow {
  /** Label estático, o `{ fieldName }` si la etiqueta misma es un campo editable (ej. parámetros bioquímicos). */
  label: React.ReactNode | { fieldName: string; maxLength?: number };
  voName: string;
  voType?: 'text' | 'number';
  /** Si se omite, la fila no tiene columna de interpretación (celda decorativa en el documento impreso). */
  intName?: string;
}

interface VoInterpretacionTableProps {
  rows: VoInterpRow[];
  formData: Record<string, any>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  /** Límites de caracteres acordes al espacio real de la celda en el documento impreso. */
  voMaxLength?: number;
  intMaxLength?: number;
}

/**
 * Patrón "Antropometría / Signos Vitales / Parámetros Bioquímicos": una
 * columna de valor obtenido (VO) y una columna opcional de interpretación
 * por fila. Ya viene con `disabled={isReadOnly}` cableado en el original —
 * se preserva vía la prop `disabled`.
 */
export default function VoInterpretacionTable({ rows, formData, onChange, disabled, voMaxLength, intMaxLength }: VoInterpretacionTableProps) {
  const val = (name: string) => (formData[name] as string) || '';
  const hasAnyInterp = rows.some(r => r.intName);

  const renderLabel = (label: VoInterpRow['label']) => {
    if (typeof label === 'object' && label !== null && 'fieldName' in label) {
      return (
        <Textarea
          name={label.fieldName}
          value={val(label.fieldName)}
          onChange={onChange}
          disabled={disabled}
          maxLength={label.maxLength}
          className="min-h-8 text-xs"
          placeholder="Parámetro"
        />
      );
    }
    return label as React.ReactNode;
  };

  return (
    <div className="hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3"></TableHead>
            <TableHead>VO</TableHead>
            {hasAnyInterp && <TableHead>Interpretación</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-normal font-medium text-slate-700">{renderLabel(row.label)}</TableCell>
              <TableCell>
                <Input
                  type={row.voType === 'number' ? 'number' : 'text'}
                  step={row.voType === 'number' ? 'any' : undefined}
                  name={row.voName}
                  value={val(row.voName)}
                  onChange={onChange}
                  disabled={disabled}
                  maxLength={voMaxLength}
                  className="h-8 text-xs px-2"
                />
              </TableCell>
              {hasAnyInterp && (
                <TableCell>
                  {row.intName ? (
                    <Textarea name={row.intName} value={val(row.intName)} onChange={onChange} disabled={disabled} maxLength={intMaxLength} className="min-h-8 text-xs" />
                  ) : (
                    <div className="h-8 bg-slate-100 rounded" />
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function VoInterpretacionMobile({ rows, formData, onChange, disabled, voMaxLength, intMaxLength }: VoInterpretacionTableProps) {
  const val = (name: string) => (formData[name] as string) || '';
  return (
    <div className="block sm:hidden space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="border border-slate-200 rounded-lg p-2.5 space-y-2">
          <div className="text-xs font-bold text-slate-700">
            {typeof row.label === 'object' && row.label !== null && 'fieldName' in row.label ? (
              <Textarea name={row.label.fieldName} value={val(row.label.fieldName)} onChange={onChange} disabled={disabled} maxLength={row.label.maxLength} className="min-h-8 text-xs" placeholder="Parámetro" />
            ) : row.label}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500">VO</label>
              <Input
                type={row.voType === 'number' ? 'number' : 'text'}
                step={row.voType === 'number' ? 'any' : undefined}
                name={row.voName}
                value={val(row.voName)}
                onChange={onChange}
                disabled={disabled}
                maxLength={voMaxLength}
                className="h-8 text-xs px-2"
              />
            </div>
            {row.intName && (
              <div>
                <label className="text-[10px] text-slate-500">Interpretación</label>
                <Textarea name={row.intName} value={val(row.intName)} onChange={onChange} disabled={disabled} maxLength={intMaxLength} className="min-h-8 text-xs" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
