import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DestructiveConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  targetIdentifier: string; // e.g. "ADM-2026-0001" or "INV-2026-00005"
  confirmButtonLabel?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isPending?: boolean;
}

export const DestructiveConfirmModal: React.FC<DestructiveConfirmModalProps> = ({
  isOpen,
  title,
  description,
  targetIdentifier,
  confirmButtonLabel = 'Execute Irreversible Action',
  onConfirm,
  onClose,
  isPending = false,
}) => {
  const [typedConfirm, setTypedConfirm] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const isConfirmed = typedConfirm.trim() === targetIdentifier.trim() && reason.trim().length >= 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          <p className="text-slate-600 leading-relaxed">{description}</p>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Two-Step Safeguard Required</span>
            </div>
            <div>
              To prevent accidental execution, enter the mandatory administrative justification and type{' '}
              <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-300 text-rose-900">
                {targetIdentifier}
              </span>{' '}
              below.
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Administrative Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Parental relocation / Audit cancellation..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-rose-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Confirmation Input <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder={`Type "${targetIdentifier}" to unlock`}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isPending}
            onClick={() => onConfirm(reason)}
            className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Executing...' : confirmButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
