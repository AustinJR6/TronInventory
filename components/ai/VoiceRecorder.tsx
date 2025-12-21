type Props = {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
};

export function VoiceRecorder({ onRecordingComplete, disabled }: Props) {
  const handleClick = () => {
    // Phase 3 stub: immediately invoke callback with empty blob
    const emptyBlob = new Blob();
    onRecordingComplete(emptyBlob);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
    >
      🎤
      <span>Voice (stub)</span>
    </button>
  );
}
