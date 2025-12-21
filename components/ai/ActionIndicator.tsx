type Props = {
  actions: Array<{
    id: string;
    actionType: string;
    status: string;
  }>;
};

const statusColor: Record<string, string> = {
  EXECUTED: 'text-green-500',
  PROPOSED: 'text-yellow-500',
  CONFIRMED: 'text-blue-500',
  FAILED: 'text-red-500',
  CANCELLED: 'text-gray-400',
};

export function ActionIndicator({ actions }: Props) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs">
      {actions.map((action) => (
        <span
          key={action.id}
          className={`inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800 ${statusColor[action.status] || ''}`}
        >
          <span>•</span>
          <span className="font-semibold">{action.actionType}</span>
          <span className="uppercase tracking-wide">{action.status}</span>
        </span>
      ))}
    </div>
  );
}
