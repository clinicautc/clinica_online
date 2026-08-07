import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

interface RowSpec {
  /** Clave usada para generar los nombres de campo (fieldName/rowExtraText) — estable aunque cambie la etiqueta. */
  key: string;
  label: string;
}

interface CheckboxGridSectionProps {
  rows: (string | RowSpec)[];
  columns: string[];
  /** Genera la clave de formData para (fila, columna). Recibe row.key (o el string tal cual). */
  fieldName: (row: string, colIndex: number) => string;
  formData: Record<string, any>;
  onChange: (name: string, checked: boolean) => void;
  /** Input de texto inline para filas específicas (ej. "Cáncer, tipo:") — clave = row.key. */
  rowExtraText?: Partial<Record<string, { value: string; onTextChange: (value: string) => void; maxLength?: number }>>;
  /** Fila final "Otras" — mismo formato de checkbox por columna que las demás filas, con un input de texto en vez de la etiqueta fija. */
  otrasRow?: {
    value: string;
    onTextChange: (value: string) => void;
    fieldName: (colIndex: number) => string;
    maxLength?: number;
  };
}

/**
 * Grid de checkboxes fila×columna fijas (ej. "Antecedentes patológicos
 * heredofamiliares": enfermedad × familiar). En móvil se apila cada fila
 * como una lista de checkboxes con su etiqueta de columna, en vez de una
 * tabla angosta de 6+ columnas.
 */
export default function CheckboxGridSection({ rows, columns, fieldName, formData, onChange, rowExtraText, otrasRow }: CheckboxGridSectionProps) {
  const normalizedRows: RowSpec[] = rows.map(r => (typeof r === 'string' ? { key: r, label: r } : r));

  return (
    <div>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Enfermedades</TableHead>
              {columns.map(c => <TableHead key={c} className="text-center">{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {normalizedRows.map(({ key, label }) => {
              const extra = rowExtraText?.[key];
              return (
              <TableRow key={key}>
                <TableCell className="whitespace-normal font-medium text-slate-700">
                  {extra ? (
                    <div className="flex items-center gap-1">
                      <span className="shrink-0">{label}</span>
                      <input
                        type="text"
                        value={extra.value}
                        onChange={e => extra.onTextChange(e.target.value)}
                        maxLength={extra.maxLength}
                        className="w-full min-w-0 border-b border-slate-300 bg-transparent text-sm outline-none"
                      />
                    </div>
                  ) : label}
                </TableCell>
                {columns.map((c, ci) => {
                  const name = fieldName(key, ci);
                  return (
                    <TableCell key={c} className="text-center">
                      <input
                        type="checkbox"
                        checked={!!formData[name]}
                        onChange={e => onChange(name, e.target.checked)}
                        className="w-4 h-4 accent-blue-900 cursor-pointer"
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
              );
            })}
            {otrasRow && (
              <TableRow>
                <TableCell className="whitespace-normal font-medium text-slate-700">
                  <div className="flex items-center gap-1">
                    <span className="shrink-0">Otras:</span>
                    <input
                      type="text"
                      value={otrasRow.value}
                      onChange={e => otrasRow.onTextChange(e.target.value)}
                      maxLength={otrasRow.maxLength}
                      className="w-full min-w-0 border-b border-slate-300 bg-transparent text-sm outline-none"
                    />
                  </div>
                </TableCell>
                {columns.map((c, ci) => {
                  const name = otrasRow.fieldName(ci);
                  return (
                    <TableCell key={c} className="text-center">
                      <input
                        type="checkbox"
                        checked={!!formData[name]}
                        onChange={e => onChange(name, e.target.checked)}
                        className="w-4 h-4 accent-blue-900 cursor-pointer"
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="block sm:hidden space-y-3">
        {normalizedRows.map(({ key, label }) => (
          <div key={key} className="border border-slate-200 rounded-lg p-2.5">
            {rowExtraText?.[key] ? (
              <div className="flex items-center gap-1 mb-2">
                <span className="shrink-0 text-xs font-bold text-slate-700">{label}</span>
                <input
                  type="text"
                  value={rowExtraText[key]!.value}
                  onChange={e => rowExtraText[key]!.onTextChange(e.target.value)}
                  maxLength={rowExtraText[key]!.maxLength}
                  className="w-full min-w-0 border-b border-slate-300 bg-transparent text-sm outline-none"
                />
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {columns.map((c, ci) => {
                const name = fieldName(key, ci);
                return (
                  <label key={c} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!formData[name]}
                      onChange={e => onChange(name, e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                    {c}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {otrasRow && (
          <div className="border border-slate-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1 mb-2">
              <span className="shrink-0 text-xs font-bold text-slate-700">Otras:</span>
              <input
                type="text"
                value={otrasRow.value}
                onChange={e => otrasRow.onTextChange(e.target.value)}
                maxLength={otrasRow.maxLength}
                className="w-full min-w-0 border-b border-slate-300 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {columns.map((c, ci) => {
                const name = otrasRow.fieldName(ci);
                return (
                  <label key={c} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!formData[name]}
                      onChange={e => onChange(name, e.target.checked)}
                      className="w-4 h-4 accent-blue-900 cursor-pointer"
                    />
                    {c}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
