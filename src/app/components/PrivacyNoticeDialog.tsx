import { ShieldCheck, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface PrivacyNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrivacyNoticeDialog({ open, onOpenChange }: PrivacyNoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#002f6c]">
            <ShieldCheck className="w-5 h-5 text-[#f26522]" />
            Aviso de Privacidad
          </DialogTitle>
          <DialogDescription>
            Clínica Universitaria UTC — tratamiento de datos personales y datos de salud
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <section>
            <h4 className="font-bold text-[#002f6c] mb-1">Responsable del tratamiento</h4>
            <p>
              La Clínica Universitaria UTC es responsable del tratamiento de los datos personales que
              nos proporcionas al registrarte y utilizar este sistema.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#002f6c] mb-1">Datos que recabamos</h4>
            <p>
              Datos de identificación y contacto (nombre, correo electrónico, teléfono) y, una vez
              registrado, datos clínicos de salud (historial nutricional, de fisioterapia, notas de
              evolución). Los datos de salud son considerados <strong>datos personales sensibles</strong>{' '}
              conforme a la LFPDPPP.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#002f6c] mb-1">Finalidades</h4>
            <p>
              Crear y administrar tu cuenta, gestionar la asignación y seguimiento de tus citas con
              practicantes, dar continuidad a tu historial clínico universitario y, en su caso,
              contactarte sobre tu atención.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#002f6c] mb-1">Transferencia de datos</h4>
            <p>
              Tus datos personales no se venden, rentan ni comparten con terceros o empresas ajenas a la
              clínica con fines comerciales o publicitarios. Solo se divulgarían en caso de que una
              autoridad competente lo requiera conforme a la ley.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#002f6c] mb-1">Fundamento legal</h4>
            <p>
              Este aviso se emite conforme a la <strong>Ley Federal de Protección de Datos Personales en
              Posesión de los Particulares</strong> (LFPDPPP), vigente desde el 21 de marzo de 2025, cuya
              autoridad en la materia es la Secretaría Anticorrupción y Buen Gobierno.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#002f6c] mb-1">Medidas de seguridad</h4>
            <p>
              El sistema aplica controles de seguridad de la información alineados con la norma{' '}
              <strong>ISO/IEC 27001:2022</strong> (organizacionales, de personal, físicos y tecnológicos),
              incluyendo autenticación con tokens, contraseñas cifradas y control de acceso por rol.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#002f6c] mb-1">Derechos ARCO</h4>
            <p>
              Puedes ejercer tus derechos de Acceso, Rectificación o Cancelación sobre tus datos
              personales contactando a la administración de la clínica. El derecho de Oposición aplica
              únicamente respecto de tratamientos no indispensables para la prestación del servicio
              clínico solicitado; no puede ejercerse sobre los datos necesarios para tu atención mientras
              tu cuenta permanezca activa.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-[#002f6c] mb-2">Referencias oficiales</h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="http://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#f26522] hover:text-[#d1551a] font-semibold underline underline-offset-2"
                >
                  Texto vigente de la LFPDPPP (Cámara de Diputados)
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://portal-transparencia.buengobierno.gob.mx/proteccion-de-datos-personales/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#f26522] hover:text-[#d1551a] font-semibold underline underline-offset-2"
                >
                  Secretaría Anticorrupción y Buen Gobierno (federal) — Datos Personales
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.iso.org/standard/27001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#f26522] hover:text-[#d1551a] font-semibold underline underline-offset-2"
                >
                  ISO/IEC 27001:2022 — Information security management systems
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
