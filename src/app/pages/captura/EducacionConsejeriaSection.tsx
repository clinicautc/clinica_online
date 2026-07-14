import { useState, Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

const NUM_COLS = 5;
const BLOQUES = [1, 2, 3, 4, 5];
const ESTADOS: Array<{ key: 'log' | 'sus' | 'nol'; label: string }> = [
  { key: 'log', label: 'Logrado' },
  { key: 'sus', label: 'Suspendida' },
  { key: 'nol', label: 'No lograda' },
];

interface EducacionConsejeriaSectionProps {
  formData: Record<string, string | boolean>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Sección "Educación Nutricional y Consejería" — 5 bloques, cada uno con dos
 * pares de textareas (Contenido/Aplicación y Bases/Estrategias) con rowSpan
 * sobre 3 filas de estado (Logrado/Suspendida/No lograda) × 5 fechas. Igual
 * que Diagnósticos Nutricios, no encaja en el patrón genérico de MatrixTable.
 */
export default function EducacionConsejeriaSection({ formData, onChange, onDateChange }: EducacionConsejeriaSectionProps) {
  const [openCol, setOpenCol] = useState(1);
  const val = (name: string) => (formData[name] as string) || '';

  return (
    <div>
      {/* Vista escritorio/tablet */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Educación Nutricional</TableHead>
              <TableHead className="w-1/4">Consejería Nutricional</TableHead>
              <TableHead>Estado</TableHead>
              {Array.from({ length: NUM_COLS }, (_, i) => i + 1).map(col => (
                <TableHead key={col} className="min-w-20">
                  <Input
                    type="text"
                    name={`edu_fecha_${col}`}
                    value={val(`edu_fecha_${col}`)}
                    onChange={onDateChange}
                    maxLength={5}
                    placeholder="DD/MM"
                    className="h-8 text-xs px-2"
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {BLOQUES.map(bloque => (
              <Fragment key={bloque}>
                {ESTADOS.map((estado, ei) => (
                  <TableRow key={`${bloque}-${estado.key}`}>
                    {ei === 0 && (
                      <>
                        <TableCell rowSpan={3} className="whitespace-normal align-top space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500">Contenido (E-1)</label>
                            <Textarea name={`edu_cont_${bloque}`} value={val(`edu_cont_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500">Aplicación (E-2)</label>
                            <Textarea name={`edu_apl_${bloque}`} value={val(`edu_apl_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
                          </div>
                        </TableCell>
                        <TableCell rowSpan={3} className="whitespace-normal align-top space-y-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500">Bases/Acercamiento Teórico (C-1)</label>
                            <Textarea name={`cons_base_${bloque}`} value={val(`cons_base_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-500">Estrategias (C-2)</label>
                            <Textarea name={`cons_est_${bloque}`} value={val(`cons_est_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell className="font-medium text-slate-600">{estado.label}</TableCell>
                    {Array.from({ length: NUM_COLS }, (_, i) => i + 1).map(col => {
                      const name = `edu_${bloque}_${estado.key}_col${col}`;
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

      {/* Vista móvil — un bloque por grupo; las fechas son el mismo campo
          global, repetidas por conveniencia dentro de cada acordeón. */}
      <div className="block sm:hidden space-y-4">
        {BLOQUES.map(bloque => (
          <div key={bloque} className="border border-slate-200 rounded-xl p-3 space-y-3">
            <p className="text-xs font-bold text-blue-900">Bloque #{bloque}</p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Contenido (E-1)</label>
              <Textarea name={`edu_cont_${bloque}`} value={val(`edu_cont_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Aplicación (E-2)</label>
              <Textarea name={`edu_apl_${bloque}`} value={val(`edu_apl_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Bases/Acercamiento Teórico (C-1)</label>
              <Textarea name={`cons_base_${bloque}`} value={val(`cons_base_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Estrategias (C-2)</label>
              <Textarea name={`cons_est_${bloque}`} value={val(`cons_est_${bloque}`)} onChange={onChange} className="min-h-14 text-xs" />
            </div>
            {Array.from({ length: NUM_COLS }, (_, i) => i + 1).map(col => (
              <div key={col} className="border border-slate-100 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenCol(openCol === col ? 0 : col)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 bg-slate-50 text-left"
                >
                  <span className="font-bold text-xs text-blue-900">Fecha {col}</span>
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <div className="w-24 max-w-[50%]" onClick={e => e.stopPropagation()}>
                      <Input
                        type="text"
                        name={`edu_fecha_${col}`}
                        value={val(`edu_fecha_${col}`)}
                        onChange={onDateChange}
                        maxLength={5}
                        placeholder="DD/MM"
                        className="h-7 text-xs px-2"
                      />
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openCol === col ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {openCol === col && (
                  <div className="p-2.5 space-y-2">
                    {ESTADOS.map(estado => {
                      const name = `edu_${bloque}_${estado.key}_col${col}`;
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
