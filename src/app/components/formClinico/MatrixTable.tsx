import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export type MatrixInputType = 'text' | 'number' | 'textarea' | 'days';

export interface MatrixRowConfig {
  label: ReactNode;
  name: (col: number) => string;
  type?: MatrixInputType;
  maxLength?: number;
}

export interface MatrixGroupHeader {
  /** Índice (0-based) de la fila de `rows` antes de la cual se inserta este encabezado. */
  beforeRow: number;
  label: string;
}

type FormDataValue = string | boolean;

interface MatrixTableProps {
  numCols: number;
  fechaName: (col: number) => string;
  fechaPlaceholder?: string;
  fechaMaxLength?: number;
  rows: MatrixRowConfig[];
  groupHeaders?: MatrixGroupHeader[];
  formData: Record<string, FormDataValue>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDaysChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Exclusivo de Seguimiento Nutricional: columna (1-6) que corresponde a la
   * consulta en curso. Si se pasa, todas las demás columnas se muestran en
   * solo lectura (anteriores ya cerradas, futuras aún no alcanzadas) — un
   * practicante solo puede escribir en `columnaActual`. Si se omite (caso de
   * Fisioterapia, que no usa este bloqueo), el comportamiento es idéntico al
   * de siempre: las 6 columnas quedan editables.
   */
  columnaActual?: number;
}

function CellInput({
  name, type, value, onChange, onDateChange, onNumberChange, onDaysChange, isDateHeader, fechaPlaceholder, fechaMaxLength, bloqueada, maxLength,
}: {
  name: string;
  type?: MatrixInputType;
  value: FormDataValue;
  onChange: MatrixTableProps['onChange'];
  onDateChange: MatrixTableProps['onDateChange'];
  onNumberChange: MatrixTableProps['onNumberChange'];
  onDaysChange: MatrixTableProps['onDaysChange'];
  isDateHeader?: boolean;
  fechaPlaceholder?: string;
  fechaMaxLength?: number;
  bloqueada?: boolean;
  maxLength?: number;
}) {
  const claseBloqueada = bloqueada ? ' bg-slate-100 text-slate-400 cursor-not-allowed' : '';
  if (isDateHeader) {
    return (
      <Input
        type="text"
        name={name}
        value={(value as string) || ''}
        onChange={onDateChange}
        readOnly={bloqueada}
        maxLength={fechaMaxLength ?? 10}
        placeholder={fechaPlaceholder ?? 'DD/MM/AAAA'}
        className={`h-8 text-xs px-2${claseBloqueada}`}
      />
    );
  }
  if (type === 'textarea') {
    return (
      <Textarea
        name={name}
        value={(value as string) || ''}
        onChange={onChange}
        readOnly={bloqueada}
        maxLength={maxLength}
        className={`min-h-16 text-xs${claseBloqueada}`}
      />
    );
  }
  if (type === 'number') {
    return (
      <Input
        type="number"
        step="any"
        name={name}
        value={(value as string) || ''}
        onChange={onNumberChange}
        readOnly={bloqueada}
        className={`h-8 text-xs px-2${claseBloqueada}`}
      />
    );
  }
  if (type === 'days') {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="text"
          name={name}
          value={(value as string) || ''}
          onChange={onDaysChange}
          readOnly={bloqueada}
          maxLength={1}
          className={`h-8 w-10 text-xs px-2 text-center${claseBloqueada}`}
        />
        <span className="text-xs text-slate-400">/7 días</span>
      </div>
    );
  }
  return (
    <Input
      type="text"
      name={name}
      value={(value as string) || ''}
      onChange={onChange}
      readOnly={bloqueada}
      maxLength={maxLength}
      className={`h-8 text-xs px-2${claseBloqueada}`}
    />
  );
}

/**
 * Grilla de captura fecha × pregunta/parámetro, patrón repetido en los 6
 * "pages" del documento institucional (Psicológicos, Sintomatología,
 * Antropometría, Signos Vitales, etc.). En escritorio se renderiza como
 * tabla real (con scroll horizontal propio de la primitiva ui/table.tsx);
 * en móvil se reorganiza por fecha (acordeón) en vez de mostrar N columnas
 * angostas — mismos campos, agrupados de otra forma, ninguno se oculta.
 */
export default function MatrixTable(props: MatrixTableProps) {
  const { numCols, fechaName, fechaPlaceholder, fechaMaxLength, rows, groupHeaders, formData, columnaActual } = props;
  const [openCol, setOpenCol] = useState(1);

  const rowsWithHeaders: Array<{ header?: string; row?: MatrixRowConfig; idx?: number }> = [];
  rows.forEach((row, idx) => {
    const header = groupHeaders?.find(g => g.beforeRow === idx);
    if (header) rowsWithHeaders.push({ header: header.label });
    rowsWithHeaders.push({ row, idx });
  });

  return (
    <div>
      {/* Vista escritorio/tablet — tabla real */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Fecha</TableHead>
              {Array.from({ length: numCols }, (_, i) => i + 1).map(col => (
                <TableHead key={col} className="min-w-28">
                  <CellInput
                    name={fechaName(col)}
                    value={formData[fechaName(col)]}
                    onChange={props.onChange}
                    onDateChange={props.onDateChange}
                    onNumberChange={props.onNumberChange}
                    onDaysChange={props.onDaysChange}
                    isDateHeader
                    fechaPlaceholder={fechaPlaceholder}
                    fechaMaxLength={fechaMaxLength}
                    bloqueada={columnaActual != null && col !== columnaActual}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowsWithHeaders.map((item, i) => {
              if (item.header) {
                return (
                  <TableRow key={`h-${i}`}>
                    <TableCell colSpan={numCols + 1} className="bg-blue-50 font-bold text-blue-900 whitespace-normal">
                      {item.header}
                    </TableCell>
                  </TableRow>
                );
              }
              const row = item.row!;
              return (
                <TableRow key={`r-${i}`}>
                  <TableCell className="whitespace-normal font-medium text-slate-700">{row.label}</TableCell>
                  {Array.from({ length: numCols }, (_, i2) => i2 + 1).map(col => {
                    const name = row.name(col);
                    return (
                      <TableCell key={col}>
                        <CellInput
                          name={name}
                          type={row.type}
                          value={formData[name]}
                          onChange={props.onChange}
                          onDateChange={props.onDateChange}
                          onNumberChange={props.onNumberChange}
                          onDaysChange={props.onDaysChange}
                          bloqueada={columnaActual != null && col !== columnaActual}
                          maxLength={row.maxLength}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Vista móvil — acordeón agrupado por fecha, mismos campos reorganizados */}
      <div className="block sm:hidden space-y-2">
        {Array.from({ length: numCols }, (_, i) => i + 1).map(col => (
          <div key={col} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenCol(openCol === col ? 0 : col)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 text-left"
            >
              <span className="font-bold text-sm text-blue-900">Fecha {col}</span>
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                <div className="w-32 max-w-[45%]" onClick={e => e.stopPropagation()}>
                  <CellInput
                    name={fechaName(col)}
                    value={formData[fechaName(col)]}
                    onChange={props.onChange}
                    onDateChange={props.onDateChange}
                    onNumberChange={props.onNumberChange}
                    onDaysChange={props.onDaysChange}
                    isDateHeader
                    fechaPlaceholder={fechaPlaceholder}
                    fechaMaxLength={fechaMaxLength}
                    bloqueada={columnaActual != null && col !== columnaActual}
                  />
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openCol === col ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {openCol === col && (
              <div className="p-3 space-y-3">
                {rowsWithHeaders.map((item, i) => {
                  if (item.header) {
                    return <p key={`h-${i}`} className="font-bold text-blue-900 text-xs uppercase tracking-wide pt-2">{item.header}</p>;
                  }
                  const row = item.row!;
                  const name = row.name(col);
                  return (
                    <div key={`r-${i}`} className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">{row.label}</label>
                      <CellInput
                        name={name}
                        type={row.type}
                        value={formData[name]}
                        onChange={props.onChange}
                        onDateChange={props.onDateChange}
                        onNumberChange={props.onNumberChange}
                        onDaysChange={props.onDaysChange}
                        bloqueada={columnaActual != null && col !== columnaActual}
                        maxLength={row.maxLength}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
