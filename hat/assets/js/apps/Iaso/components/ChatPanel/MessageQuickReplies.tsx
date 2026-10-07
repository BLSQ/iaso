import React, { FC } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { ChatMessage, SendMessageOptions } from './ChatPanel';
import MESSAGES from './messages';
import { QuickReplyForm } from './QuickReplyForm';

type MessageQuickRepliesProps = {
    message: ChatMessage;
    isLast: boolean;
    isLoading: boolean;
    onSendMessage: (message: string, options?: SendMessageOptions) => void;
};

// A message's quick-reply form stays visible once answered (so the picked answers remain readable
// on the original bubble), but is only interactive on the last message while nothing is loading.
export const MessageQuickReplies: FC<MessageQuickRepliesProps> = ({
    message,
    isLast,
    isLoading,
    onSendMessage,
}) => {
    const { formatMessage } = useSafeIntl();
    if (
        message.role !== 'assistant' ||
        !message.quickReplies ||
        message.quickReplies.length === 0
    ) {
        return null;
    }
    const isAnswered = message.quickReplies.every(
        group => group.selectedOptionIndex !== undefined,
    );
    if (!isAnswered && !(isLast && !isLoading)) {
        return null;
    }
    return (
        <QuickReplyForm
            groups={message.quickReplies}
            onConfirm={(summary, selections) => {
                onSendMessage(summary, {
                    displayContent: formatMessage(MESSAGES.answeredQuestions),
                    quickReplyAnswer: {
                        messageId: message.id,
                        selections,
                    },
                });
            }}
        />
    );
};
