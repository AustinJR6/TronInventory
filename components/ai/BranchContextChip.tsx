type Props = {
  branchName?: string | null;
  onClear?: () => void;
};

export function BranchContextChip({ branchName, onClear }: Props) {
  if (!branchName) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-100">
      <span>Context: {branchName}</span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-50"
        >
          change
        </button>
      )}
    </div>
  );
}
