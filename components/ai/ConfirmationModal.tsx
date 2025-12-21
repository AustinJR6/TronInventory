type Props = {
  action: {
    id: string;
    actionType: string;
    proposedData?: string | null;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({ action, onConfirm, onCancel }: Props) {
  if (!action) return null;

  const parsed = (() => {
    try {
      return action.proposedData ? JSON.parse(action.proposedData) : {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-tron-gray">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Confirm action
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-200">
          {action.actionType}
        </p>

        <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-100">
{JSON.stringify(parsed, null, 2)}
        </pre>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
