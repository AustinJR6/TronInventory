type Props = {
  onPromptSelect: (prompt: string) => void;
};

const QUICK_PROMPTS = [
  'Check stock for 12/2 MC',
  'Build order for #10 black and 1/2 EMT',
  'Show my recent orders',
  'Low stock report',
  'Request transfer',
];

export function CommandBar({ onPromptSelect }: Props) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {QUICK_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPromptSelect(prompt)}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
