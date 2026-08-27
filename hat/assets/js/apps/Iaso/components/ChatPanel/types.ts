export type ChatMessageRole = 'user' | 'assistant';

export type ChatQuickReplyQuestion = {
    question: string;
    options: string[];
    selectedOptionIndex?: number;
};

export type ChatMessageAttachment = {
    id: string;
    filename: string;
};

export type ChatMessage = {
    role: ChatMessageRole;
    content: string;
    id: string;
    quickReplies?: ChatQuickReplyQuestion[];
    attachments?: ChatMessageAttachment[];
};

export type QuickReplyAnswer = {
    messageId: string;
    // Group index -> selected option index.
    selections: Record<number, number>;
};

export type PendingAttachmentStatus = 'uploading' | 'ready' | 'error';

export type PendingAttachment = ChatMessageAttachment & {
    status: PendingAttachmentStatus;
};

export type SendMessageOptions = {
    // `message` is always what's sent to the conversation; `displayContent` overrides what's
    // shown in the resulting user bubble (used for a quick-reply confirmation, whose picked
    // answers are already visible in the question's own bubble).
    displayContent?: string;
    // Present when this send confirms a quick-reply form - pass to `applyQuickReplyAnswer` to
    // record it on the originating message.
    quickReplyAnswer?: QuickReplyAnswer;
    attachments?: ChatMessageAttachment[];
};
