'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/components/ai/ChatMessage';
import { ConfirmationModal } from '@/components/ai/ConfirmationModal';
import { ActionIndicator } from '@/components/ai/ActionIndicator';
import { VoiceRecorder } from '@/components/ai/VoiceRecorder';
import { CommandBar } from '@/components/ai/CommandBar';
import { BranchContextChip } from '@/components/ai/BranchContextChip';

type Message = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: string;
};

type AiAction = {
  id: string;
  actionType: string;
  status: string;
  proposedData?: string | null;
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'ASSISTANT',
  content:
    "Hi, I'm Lana. Tell me what you need and I'll guide you. I always confirm before creating orders or pulling items.",
};

export default function AiAssistantPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<
    Array<{ id: string; topic: string; status: string; lastMessageAt: string }>
  >([]);
  const [messages, setMessages] = useState<Message[]>([
    WELCOME_MESSAGE,
  ]);
  const [actions, setActions] = useState<AiAction[]>([]);
  const [pendingAction, setPendingAction] = useState<AiAction | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Optional: hydrate branch context from session storage if available
    if (typeof window !== 'undefined') {
      setBranchName(sessionStorage.getItem('branchName'));
    }
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/ai-assistant/conversations');
        const data = await res.json();
        if (res.ok && data.conversations?.length) {
          setConversations(data.conversations);
          const latest = data.conversations[0];
          setConversationId(latest.id);
          await hydrateConversation(latest.id);
        } else {
          setConversations([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  const hydrateConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ai-assistant/conversations/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load conversation');
      }
      const mappedMessages: Message[] = data.conversation.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }));
      setMessages(
        mappedMessages.length
          ? mappedMessages
          : [WELCOME_MESSAGE]
      );
      setActions(data.conversation.actions || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setError(null);
    setIsProcessing(true);

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setConversationId(data.conversationId);

      const assistantMessage: Message = {
        id: data.assistantMessage?.id || crypto.randomUUID(),
        role: 'ASSISTANT',
        content: data.aiResponse,
        createdAt: data.assistantMessage?.createdAt,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setActions(data.proposedActions || []);
      setPendingAction(
        data.requiresConfirmation && data.proposedActions?.length
          ? data.proposedActions[0]
          : null
      );
      if (!conversations.find((c) => c.id === data.conversationId)) {
        setConversations((prev) => [
          { id: data.conversationId, topic: data.topic || 'general', status: 'ACTIVE', lastMessageAt: new Date().toISOString() },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    try {
      const response = await fetch('/api/ai-assistant/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: pendingAction.id, confirmed: true }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm action');
      }

      setActions((prev) =>
        prev.map((a) => (a.id === pendingAction.id ? { ...a, status: data.action.status } : a))
      );
      setPendingAction(null);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm action');
    }
  };

  const handleCancel = async () => {
    if (!pendingAction) return;
    try {
      const response = await fetch('/api/ai-assistant/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: pendingAction.id, confirmed: false }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel action');
      }

      setActions((prev) =>
        prev.map((a) => (a.id === pendingAction.id ? { ...a, status: 'CANCELLED' } : a))
      );
      setPendingAction(null);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel action');
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Lana - AI Assistant
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Text-only (Phase 1). Confirmations required for any changes.
          </p>
          <div className="mt-2">
            <BranchContextChip branchName={branchName} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {conversations.length > 0 && (
            <select
              value={conversationId || ''}
              onChange={async (e) => {
                const id = e.target.value;
                setConversationId(id);
                if (id) {
                  await hydrateConversation(id);
                }
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Start new conversation</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.topic || 'conversation'} • {new Date(c.lastMessageAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => {
              setConversationId(null);
              setMessages([WELCOME_MESSAGE]);
              setActions([]);
              setPendingAction(null);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            New Chat
          </button>
        </div>
      </header>

      <section
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-600 dark:text-gray-300">
            Loading conversation...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isUser={message.role === 'USER'}
              />
            ))}

            <ActionIndicator actions={actions} />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {error && (
          <div className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-50">
            {error}
          </div>
        )}
        <div className="flex items-center gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Lana to check stock or build an order..."
            className="h-24 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={isProcessing}
              className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? 'Thinking...' : 'Send'}
            </button>
            <VoiceRecorder onRecordingComplete={() => {}} disabled />
          </div>
        </div>
        <CommandBar onPromptSelect={(prompt) => setInput(prompt)} />
      </section>

      <ConfirmationModal
        action={pendingAction}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
