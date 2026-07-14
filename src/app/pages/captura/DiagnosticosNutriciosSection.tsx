import { useState, Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

const NUM_COLS = 6;
const GRUPOS = [1, 2, 3, 4, 5];
const ESTADOS: Array<{ key: 'nuevo' | 'cont' | 'res'; label: string }> = [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'cont', label: 'Continuo' },
  { key: 'res', label: 'Resuelto' },
];

interface DiagnosticosNutriciosSectionProps {
  formData: Record<string, string | boolean>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Sección "Diagnósticos Nutricios" del documento — 5 grupos, cada uno con un
 * diagnóstico (textarea) y 3 estados (Nuevo/Continuo/Resuelto) × 6 fechas.
 * No encaja en el patrón genérico de MatrixTable por el rowSpan del
 * diagnóstico sobre sus 3 filas de estado, así que vive como componente
 * propio de este formulario.
 */
export default function DiagnosticosNutriciosSection({ formData, onChange, onDateChange }: DiagnosticosNutriciosSectionProps) {
  const [openCol, setOpenCol] = useState(1);
  const val = (name: string) => (formData[name] as string) || '';

  return (
    <div>
      {/* Vista escritorio/tablet */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Diagnóstico</TableHead>
              <TableHead>Estado</TableHead>
              {Array.from({ length: NUM_COLS }, (_, i) => i + 1).map(col => (
                <TableHead key={col} className="min-w-24">
                  <Input
                    type="text"
                    name={`diag_nutri_fecha_${col}`}
                    value={val(`diag_nutri_fecha_${col}`)}
                    onChange={onDateChange}
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    className="h-8 text-xs px-2"
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {GRUPOS.map(grupo => (
              <Fragment key={grupo}>
                {ESTADOS.map((estado, ei) => (
                  <TableRow key={`${grupo}-${estado.key}`}>
                    {ei === 0 && (
                      <TableCell rowSpan={3} className="whitespace-normal align-top">
                        <Textarea
                          name={`diag_nutri_txt_${grupo}`}
                          value={val(`diag_nutri_txt_${grupo}`)}
                          onChange={onChange}
                          className="min-h-20 text-xs"
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-slate-600">{estado.label}</TableCell>
                    {Array.from({ length: NUM_COLS }, (_, i) => i + 1).map(col => {
                      const name = `diag_nutri_${grupo}_${estado.key}_col${col}`;
                      return (
                        <TableCell key={col}>
                          <Input type="text" name={name} value={val(name)} onChange={onChange} className="h-8 text-xs px-2" />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vista móvil — un bloque por grupo de diagnóstico; las fechas son el
          mismo campo global, se muestran repetidas por conveniencia dentro de
          cada acordeón de grupo. */}
      <div className="block sm:hidden space-y-4">
        {GRUPOS.map(grupo => (
          <div key={grupo} className="border border-slate-200 rounded-xl p-3 space-y-3">
            <label className="text-xs font-bold text-blue-900">Diagnóstico #{grupo}</label>
            <Textarea
              name={`diag_nutri_txt_${grupo}`}
              value={val(`diag_nutri_txt_${grupo}`)}
              onChange={onChange}
              className="min-h-20 text-xs"
            />
            {Array.from({ length: NUM_COLS }, (_, i) => i + 1).map(col => (
              <div key={col} className="border border-slate-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenCol(openCol === col ? 0 : col)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 bg-slate-50 text-left"
                >
                  <span className="font-bold text-xs text-blue-900">Fecha {col}</span>
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <div className="w-28 max-w-[50%]" onClick={e => e.stopPropagation()}>
                      <Input
                        type="text"
                        name={`diag_nutri_fecha_${col}`}
                        value={val(`diag_nutri_fecha_${col}`)}
                        onChange={onDateChange}
                        maxLength={10}
                        placeholder="DD/MM/AAAA"
                        className="h-7 text-xs px-2"
                      />
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openCol === col ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {openCol === col && (
                  <div className="p-2.5 space-y-2">
                    {ESTADOS.map(estado => {
                      const name = `diag_nutri_${grupo}_${estado.key}_col${col}`;
                      return (
                        <div key={estado.key} className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">{estado.label}</label>
                          <Input type="text" name={name} value={val(name)} onChange={onChange} className="h-8 text-xs" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
