/** Delete confirmation modal — forge-styled overlay matching LLMSettingsModal pattern. */

interface DeleteConfirmModalProps {
  projectName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ projectName, isDeleting, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.65)' }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(249, 115, 22, 0.05)',
        }}
      >
        <h3 className="text-base font-bold text-zinc-100 font-display tracking-wide mb-2">Delete Project</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Are you sure you want to delete <span className="text-zinc-200 font-medium">{projectName}</span>? This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-zinc-400 rounded-xl transition-all hover:text-zinc-100 disabled:opacity-50"
            style={{ border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl font-display transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
