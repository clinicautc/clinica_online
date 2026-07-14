import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

interface CheckboxGridSectionProps {
  rows: string[];
  columns: string[];
  /** Genera la clave de formData para (fila, columna). */
  fieldName: (row: string, colIndex: number) => string;
  formData: Record<string, any>;
  onChange: (name: string, checked: boolean) => void;
}

/**
 * Grid de checkboxes fila×columna fijas (ej. "Antecedentes patológicos
 * heredofamiliares": enfermedad × familiar). En móvil se apila cada fila
 * como una lista de checkboxes con su etiqueta de columna, en vez de una
 * tabla angosta de 6+ columnas.
 */
export default function CheckboxGridSection({ rows, columns, fieldName, formData, onChange }: CheckboxGridSectionProps) {
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
            {rows.map(row => (
              <TableRow key={row}>
                <TableCell className="whitespace-normal font-medium text-slate-700">{row}</TableCell>
                {columns.map((c, ci) => {
                  const name = fieldName(row, ci);
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
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="block sm:hidden space-y-3">
        {rows.map(row => (
          <div key={row} className="border border-slate-200 rounded-lg p-2.5">
            <p className="text-xs font-bold text-slate-700 mb-2">{row}</p>
            <div className="grid grid-cols-2 gap-2">
              {columns.map((c, ci) => {
                const name = fieldName(row, ci);
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
      </div>
    </div>
  );
}
