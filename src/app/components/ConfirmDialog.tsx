import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: ReactNode;
  title: string;
  description: ReactNode;
  infoBox?: ReactNode;
  confirmLabel?: string;
  confirmClass?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  hideConfirm?: boolean;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  infoBox,
  confirmLabel = 'Confirmar',
  confirmClass = 'flex-1 bg-blue-900 hover:bg-blue-800 font-bold shadow-md',
  onConfirm,
  cancelLabel = 'Cancelar',
  hideConfirm = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-xl font-black flex items-center gap-3">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-600 font-medium mt-1">
            {description}
          </DialogDescription>
        </DialogHeader>
        {infoBox && (
          <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
            {infoBox}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 font-bold border border-slate-200 hover:bg-slate-50"
          >
            {cancelLabel}
          </Button>
          {!hideConfirm && (
            <Button onClick={handleConfirm} className={confirmClass}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
