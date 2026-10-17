import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm" />
        <Dialog.Content className="glass-strong page-enter fixed left-1/2 top-1/2 z-50 max-h-[88dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-ink-900/90 p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-400">{description ?? ' '}</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close" className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
