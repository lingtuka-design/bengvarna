import { Modal } from './Modal'
import { Button } from './Button'
import { Icon } from './Icon'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} labelledBy="confirm-title">
      <div className="p-6">
        <div
          className={
            danger
              ? 'flex size-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
              : 'flex size-11 items-center justify-center rounded-full bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-400'
          }
        >
          <Icon name="alert" className="size-5" />
        </div>
        <h2 id="confirm-title" className="mt-4 font-display text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
