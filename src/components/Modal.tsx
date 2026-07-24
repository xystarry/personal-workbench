import { useState, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl2 z-10">
            <h2 className="text-lg font-semibold text-warm-800">{title}</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

// 通用确认对话框
export function ConfirmDialog({ open, onClose, onConfirm, title, message }: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center' }}>
      <div className="bg-white rounded-2xl p-5 mx-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-warm-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium">取消</button>
          <button onClick={() => { onConfirm(); onClose() }} className="flex-1 py-2.5 rounded-lg bg-red-400 text-white text-sm font-medium">确定</button>
        </div>
      </div>
    </div>
  )
}
