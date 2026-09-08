import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import {
    applyQuickReplyAnswer,
    ChatMessage,
    ChatPanel,
    ChatQuickReplyQuestion,
} from './ChatPanel';

// jsdom doesn't implement scrollIntoView; ChatPanel calls it on every message list update.
beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
});

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? 'msg'),
        }),
    };
});

const baseProps = {
    isLoading: false,
    emptyState: <div />,
    title: 'Test chat',
};

const assistantMessage = (
    content: string,
    quickReplies?: ChatQuickReplyQuestion[],
): ChatMessage => ({
    role: 'assistant',
    content,
    id: `assistant-${content}`,
    quickReplies,
});

const userMessage = (content: string): ChatMessage => ({
    role: 'user',
    content,
    id: `user-${content}`,
});

const MULTI_GROUP_QUICK_REPLIES: ChatQuickReplyQuestion[] = [
    {
        question: 'Which incidence source?',
        options: ['SNIS adjusted', 'SNIS crude incidence'],
    },
    {
        question: 'Combine with prevalence?',
        options: ['Keep incidence only', 'Classify both'],
    },
];

const answered = (
    groups: ChatQuickReplyQuestion[],
    picks: number[],
): ChatQuickReplyQuestion[] =>
    groups.map((group, i) => ({ ...group, selectedOptionIndex: picks[i] }));

describe('ChatPanel quick replies', () => {
    it('renders the form only on the last assistant message', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    assistantMessage(
                        'older question',
                        MULTI_GROUP_QUICK_REPLIES,
                    ),
                    userMessage('my answer'),
                    assistantMessage(
                        'latest question',
                        MULTI_GROUP_QUICK_REPLIES,
                    ),
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        expect(
            screen.getAllByRole('button', { name: 'Send answers' }),
        ).toHaveLength(1);
    });

    it('does not render the form while isLoading', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                isLoading
                messages={[
                    assistantMessage('question', MULTI_GROUP_QUICK_REPLIES),
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Send answers' }),
        ).not.toBeInTheDocument();
    });

    it('does not render the form on a user message', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    {
                        ...userMessage('typed text'),
                        quickReplies: MULTI_GROUP_QUICK_REPLIES,
                    },
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Send answers' }),
        ).not.toBeInTheDocument();
    });

    it('numbers questions when there is more than one', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    assistantMessage('question', MULTI_GROUP_QUICK_REPLIES),
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        expect(
            screen.getByText('1. Which incidence source?'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('2. Combine with prevalence?'),
        ).toBeInTheDocument();
    });

    it('leaves a single question unnumbered', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    assistantMessage('question', [
                        {
                            question: 'Which layer did you mean?',
                            options: ['Rainfall', 'Incidence'],
                        },
                    ]),
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        expect(
            screen.getByText('Which layer did you mean?'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('1. Which layer did you mean?'),
        ).not.toBeInTheDocument();
    });

    it('keeps Send answers disabled until every question is answered', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    assistantMessage('question', MULTI_GROUP_QUICK_REPLIES),
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        const confirmButton = screen.getByRole('button', {
            name: 'Send answers',
        });
        expect(confirmButton).toBeDisabled();

        fireEvent.click(screen.getByLabelText('SNIS adjusted'));
        expect(confirmButton).toBeDisabled();

        fireEvent.click(screen.getByLabelText('Keep incidence only'));
        expect(confirmButton).toBeEnabled();
    });

    it('confirms with a synthesized question -> answer summary and freezes afterwards', () => {
        const onSendMessage = vi.fn();
        const question = assistantMessage(
            'question',
            MULTI_GROUP_QUICK_REPLIES,
        );
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[question]}
                onSendMessage={onSendMessage}
            />,
        );

        fireEvent.click(screen.getByLabelText('SNIS adjusted'));
        fireEvent.click(screen.getByLabelText('Keep incidence only'));

        const confirmButton = screen.getByRole('button', {
            name: 'Send answers',
        });
        fireEvent.click(confirmButton);

        expect(onSendMessage).toHaveBeenCalledTimes(1);
        expect(onSendMessage).toHaveBeenCalledWith(
            'Which incidence source? → SNIS adjusted\nCombine with prevalence? → Keep incidence only',
            {
                displayContent: 'Sent selected answers',
                quickReplyAnswer: {
                    messageId: question.id,
                    selections: { 0: 0, 1: 0 },
                },
            },
        );
        // The button disappears (rather than staying visible-but-disabled) once answered - see the
        // "keeps the original bubble..." test below for the read-only, no-double-submit guarantee.
        expect(
            screen.queryByRole('button', { name: 'Send answers' }),
        ).not.toBeInTheDocument();
        // Frozen rows block changes via the onChange guard, not the DOM `disabled` attribute (see
        // the comment on the RadioGroup's onChange handler) - clicking another option is a no-op.
        fireEvent.click(screen.getByLabelText('SNIS crude incidence'));
        expect(screen.getByLabelText('SNIS adjusted')).toBeChecked();
        expect(screen.getByLabelText('SNIS crude incidence')).not.toBeChecked();
    });

    it('keeps the original bubble showing the picked answers once a later message arrives', () => {
        const onSendMessage = vi.fn();
        const question = assistantMessage(
            'question',
            MULTI_GROUP_QUICK_REPLIES,
        );
        const { rerender } = renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[question]}
                onSendMessage={onSendMessage}
            />,
        );

        fireEvent.click(screen.getByLabelText('SNIS adjusted'));
        fireEvent.click(screen.getByLabelText('Keep incidence only'));
        fireEvent.click(screen.getByRole('button', { name: 'Send answers' }));

        // Simulate the parent (e.g. useCompositeLayerAIChat) recording the confirmed picks onto
        // the originating message's `quickReplies` and appending the follow-up user message, the
        // same way it would after typed text.
        const answeredQuestion = {
            ...question,
            quickReplies: answered(MULTI_GROUP_QUICK_REPLIES, [0, 0]),
        };
        rerender(
            <ChatPanel
                {...baseProps}
                messages={[
                    answeredQuestion,
                    userMessage(
                        'Which incidence source? → SNIS adjusted\nCombine with prevalence? → Keep incidence only',
                    ),
                ]}
                onSendMessage={onSendMessage}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Send answers' }),
        ).not.toBeInTheDocument();
        expect(screen.getByLabelText('SNIS adjusted')).toBeChecked();
        expect(screen.getByLabelText('Keep incidence only')).toBeChecked();
        fireEvent.click(screen.getByLabelText('SNIS crude incidence'));
        expect(screen.getByLabelText('SNIS adjusted')).toBeChecked();
        expect(screen.getByLabelText('SNIS crude incidence')).not.toBeChecked();
    });

    it('renders as already-answered on a fresh mount, not just a rerender', () => {
        // Regression test: a message's answered state must be derivable from its own
        // `quickReplies` (via `selectedOptionIndex`), so it renders correctly on a first mount -
        // not only after a rerender of an already-mounted ChatPanel instance.
        const answeredQuestion = assistantMessage(
            'question',
            answered(MULTI_GROUP_QUICK_REPLIES, [0, 1]),
        );
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    answeredQuestion,
                    userMessage(
                        'Which incidence source? → SNIS adjusted\nCombine with prevalence? → Classify both',
                    ),
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Send answers' }),
        ).not.toBeInTheDocument();
        expect(screen.getByLabelText('SNIS adjusted')).toBeChecked();
        expect(screen.getByLabelText('Classify both')).toBeChecked();
        fireEvent.click(screen.getByLabelText('SNIS crude incidence'));
        expect(screen.getByLabelText('SNIS adjusted')).toBeChecked();
        expect(screen.getByLabelText('SNIS crude incidence')).not.toBeChecked();
    });
});

describe('ChatPanel revert action', () => {
    it('renders a Revert icon button only on revertable assistant messages', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    { ...assistantMessage('plain') },
                    { ...assistantMessage('applied'), revertable: true },
                    userMessage('hi'),
                ]}
                onSendMessage={vi.fn()}
                onRevert={vi.fn()}
            />,
        );

        expect(
            screen.getAllByRole('button', { name: 'Revert this change' }),
        ).toHaveLength(1);
    });

    it('confirms before reverting, then calls onRevert with the message id', async () => {
        const onRevert = vi.fn();
        const applied = { ...assistantMessage('applied'), revertable: true };
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[applied]}
                onSendMessage={vi.fn()}
                onRevert={onRevert}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Revert this change' }),
        );
        expect(onRevert).not.toHaveBeenCalled();

        fireEvent.click(await screen.findByRole('button', { name: 'Revert' }));
        expect(onRevert).toHaveBeenCalledWith(applied.id);
    });

    it('does not revert when the confirmation is cancelled', async () => {
        const onRevert = vi.fn();
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    { ...assistantMessage('applied'), revertable: true },
                ]}
                onSendMessage={vi.fn()}
                onRevert={onRevert}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Revert this change' }),
        );
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

        expect(onRevert).not.toHaveBeenCalled();
    });

    it('does not revert from an open confirmation once a request is in flight', async () => {
        const onRevert = vi.fn();
        const applied = { ...assistantMessage('applied'), revertable: true };
        const { rerender } = renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[applied]}
                onSendMessage={vi.fn()}
                onRevert={onRevert}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Revert this change' }),
        );
        await screen.findByRole('button', { name: 'Revert' });

        rerender(
            <ChatPanel
                {...baseProps}
                isLoading
                messages={[applied]}
                onSendMessage={vi.fn()}
                onRevert={onRevert}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Revert' }));

        expect(onRevert).not.toHaveBeenCalled();
    });

    it('shows a discreet Reverted note once the message is reverted', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    {
                        ...assistantMessage('applied'),
                        revertable: true,
                        reverted: true,
                    },
                ]}
                onSendMessage={vi.fn()}
                onRevert={vi.fn()}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Revert this change' }),
        ).toBeNull();
        expect(screen.getByText('Reverted')).toBeTruthy();
    });

    it('renders nothing revert-related without an onRevert handler', () => {
        renderWithThemeAndIntlProvider(
            <ChatPanel
                {...baseProps}
                messages={[
                    { ...assistantMessage('applied'), revertable: true },
                ]}
                onSendMessage={vi.fn()}
            />,
        );

        expect(
            screen.queryByRole('button', { name: 'Revert this change' }),
        ).toBeNull();
    });
});

describe('applyQuickReplyAnswer', () => {
    it("sets selectedOptionIndex on the matching message's quick replies", () => {
        const question = assistantMessage(
            'question',
            MULTI_GROUP_QUICK_REPLIES,
        );
        const messages: ChatMessage[] = [question, userMessage('other')];

        const result = applyQuickReplyAnswer(messages, {
            messageId: question.id,
            selections: { 0: 1, 1: 0 },
        });

        expect(result[0].quickReplies).toEqual(
            answered(MULTI_GROUP_QUICK_REPLIES, [1, 0]),
        );
        expect(result[1]).toBe(messages[1]);
    });

    it('leaves messages unchanged when no id matches', () => {
        const messages: ChatMessage[] = [
            assistantMessage('question', MULTI_GROUP_QUICK_REPLIES),
        ];

        const result = applyQuickReplyAnswer(messages, {
            messageId: 'does-not-exist',
            selections: { 0: 0, 1: 0 },
        });

        expect(result).toEqual(messages);
    });
});
