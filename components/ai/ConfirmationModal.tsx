type Props = {
  actions: Array<{
    id: string;
    actionType: string;
    proposedData?: string | null;
  }>;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({ actions, onConfirm, onCancel }: Props) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-tron-gray">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Confirm {actions.length} {actions.length === 1 ? 'action' : 'actions'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-200">
          Review the actions Lana wants to perform:
        </p>

        <div className="mt-4 max-h-96 space-y-3 overflow-auto">
          {actions.map((action, index) => {
            const parsed = (() => {
              try {
                return action.proposedData ? JSON.parse(action.proposedData) : {};
              } catch {
                return {};
              }
            })();

            return (
              <div
                key={action.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {index + 1}. {action.actionType.replace(/_/g, ' ')}
                  </h4>
                </div>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-white p-2 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-100">
{JSON.stringify(parsed, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Cancel All
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Confirm All
          </button>
        </div>
      </div>
    </div>
  );
}
