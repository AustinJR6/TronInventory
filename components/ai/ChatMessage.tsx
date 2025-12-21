type Props = {
  message: {
    id: string;
    content: string;
    createdAt?: string;
  };
  isUser?: boolean;
};

export function ChatMessage({ message, isUser }: Props) {
  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
        isUser
          ? 'bg-orange-500 text-white'
          : 'bg-gray-100 text-gray-900 dark:bg-tron-gray dark:text-white'
      }`}>
        <div className="whitespace-pre-line leading-relaxed">{message.content}</div>
        {message.createdAt && (
          <div className="mt-2 text-[11px] opacity-70">
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
