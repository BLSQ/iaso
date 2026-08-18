import React, {
    FC,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormLabel,
    Paper,
    Radio,
    RadioGroup,
    SxProps,
    TextField,
    Theme,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import ReactMarkdown from 'react-markdown';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from './messages';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatQuickReplyQuestion = {
    question: string;
    options: string[];
    selectedOptionIndex?: number;
};

export type ChatMessage = {
    role: ChatMessageRole;
    content: string;
    id: string;
    quickReplies?: ChatQuickReplyQuestion[];
};

export type QuickReplyAnswer = {
    messageId: string;
    // Group index -> selected option index.
    selections: Record<number, number>;
};

export type SendMessageOptions = {
    // `message` is always what's sent to the conversation; `displayContent` overrides what's
    // shown in the resulting user bubble (used for a quick-reply confirmation, whose picked
    // answers are already visible in the question's own bubble).
    displayContent?: string;
    // Present when this send confirms a quick-reply form - pass to `applyQuickReplyAnswer` to
    // record it on the originating message.
    quickReplyAnswer?: QuickReplyAnswer;
};

// Applies a confirmed quick-reply answer onto the message it belongs to, setting each question's
// `selectedOptionIndex`. Exported so every `ChatPanel` consumer applies answers the same way,
// instead of each reimplementing the id lookup and per-question merge.
export const applyQuickReplyAnswer = (
    messages: ChatMessage[],
    answer: QuickReplyAnswer,
): ChatMessage[] =>
    messages.map(message =>
        message.id === answer.messageId && message.quickReplies
            ? {
                  ...message,
                  quickReplies: message.quickReplies.map((question, index) => ({
                      ...question,
                      selectedOptionIndex: answer.selections[index],
                  })),
              }
            : message,
    );

const messageRow = (role: ChatMessageRole): SxProps<Theme> => ({
    display: 'flex',
    gap: 1,
    alignItems: 'flex-start',
    flexDirection: role === 'user' ? 'row-reverse' : 'row',
});

const avatar = (role: ChatMessageRole): SxProps<Theme> => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: role === 'user' ? 'primary.main' : 'grey.300',
    color: role === 'user' ? 'primary.contrastText' : 'text.primary',
    flexShrink: 0,
});

const bubble = (role: ChatMessageRole): SxProps<Theme> => ({
    p: 1.5,
    maxWidth: '80%',
    bgcolor: role === 'user' ? 'primary.light' : 'grey.100',
    color: role === 'user' ? 'primary.contrastText' : 'text.primary',
    borderRadius: 2,
});

type Props = {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string, options?: SendMessageOptions) => void;
    // Content shown in place of the message list when there are no messages yet.
    emptyState: ReactNode;
    title: ReactNode;
    subtitle?: ReactNode;
    // Small pill shown next to the title, e.g. an "AI" badge. Omit to hide it.
    badge?: ReactNode;
    titleIcon?: ReactNode;
    placeholder?: string;
    // When true, message content is rendered as markdown instead of plain text.
    interpretMarkdown?: boolean;
    sx?: SxStyles;
};

const defaultStyles: SxStyles = {
    root: {
        height: `100%`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        px: 2,
        pt: 2,
        pb: 1.5,
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
    },
    headerTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        mb: 0.5,
    },
    headerTitle: {
        fontWeight: 700,
        fontSize: '1.1rem',
        color: 'text.primary',
        lineHeight: 1.2,
    },
    aiBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        px: 0.75,
        py: 0.125,
        borderRadius: 1,
        bgcolor: 'primary.50',
        color: 'primary.main',
        fontSize: '0.7rem',
        fontWeight: 700,
        lineHeight: 1.4,
    },
    headerSubtitle: {
        color: 'text.secondary',
        fontSize: '0.875rem',
    },
    messagesArea: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    emptyState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
        gap: 1.5,
    },
    loadingAvatar: {
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.300',
        flexShrink: 0,
    },
    loadingRow: {
        display: 'flex',
        gap: 1,
        alignItems: 'center',
    },
    inputArea: {
        p: 2,
        borderTop: theme => `1px solid ${theme.palette.divider}`,
    },
    inputContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 0.75,
        borderRadius: 2,
        border: theme => `1px solid ${theme.palette.divider}`,
        bgcolor: 'common.white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    },
    inputField: {
        flex: 1,
        '& .MuiInputBase-root': {
            fontSize: '0.875rem',
            alignItems: 'center',
        },
        '& .MuiOutlinedInput-root': {
            p: 0,
        },
        '& .MuiInputBase-input': {
            py: 1,
            px: 0,
        },
        '& fieldset': {
            border: 'none',
        },
        '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
        },
    },
    sendButton: {
        minWidth: 40,
        width: 40,
        height: 40,
        borderRadius: '50%',
        p: 0,
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
    },
    quickReplyForm: {
        mt: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
    },
    quickReplyGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
    },
    quickReplyQuestion: {
        fontWeight: 700,
        fontSize: '0.875rem',
        color: 'text.primary',
        mb: 0.25,
        // MUI's FormLabel switches to the primary color when a child Radio is focused; pin it to
        // a static color instead, since focus/selection here shouldn't recolor the question text.
        '&.Mui-focused': {
            color: 'text.primary',
        },
    },
    quickReplyOption: {
        m: 0,
        px: 1,
        py: 0.25,
        borderRadius: 1.5,
        '& .MuiFormControlLabel-label': {
            fontSize: '0.875rem',
        },
    },
    quickReplyOptionSelected: {
        bgcolor: 'primary.light',
        fontWeight: 600,
    },
    quickReplySendButton: {
        borderRadius: '24px',
        fontWeight: 700,
        py: 1.25,
        textTransform: 'none',
    },
    markdownContent: {
        typography: 'body2',
        '& > :first-of-type': { mt: 0 },
        '& > :last-of-type': { mb: 0 },
        '& p, & ul, & ol': { mt: 0, mb: 1 },
        '& ul, & ol': { pl: 2.5 },
        '& pre': {
            overflowX: 'auto',
            bgcolor: 'rgba(0, 0, 0, 0.06)',
            p: 1,
            borderRadius: 1,
        },
        '& code': {
            fontFamily: 'monospace',
            fontSize: '0.85em',
        },
        '& pre code': {
            fontSize: 'inherit',
        },
    },
};

type QuickReplyFormProps = {
    groups: ChatQuickReplyQuestion[];
    onConfirm: (summary: string, selections: Record<number, number>) => void;
};

// Renders inside the assistant's own bubble. Confirming sends a synthesized "question -> answer"
// summary through the same onSendMessage path as typed text - there's no structured "form
// submission" turn in the underlying chat API, so a deterministic text summary is the simplest way
// to carry the answers forward.
const QuickReplyForm: FC<QuickReplyFormProps> = ({ groups, onConfirm }) => {
    const { formatMessage } = useSafeIntl();
    // Only holds in-progress picks, keyed by group index, before they're confirmed onto `groups`
    // itself (via `group.selectedOptionIndex`) - once a group already carries an answer, its value
    // always wins over anything here.
    const [selections, setSelections] = useState<Record<number, number>>({});
    // Local fallback so the form freezes on click even if the caller doesn't apply the answer to
    // `groups` synchronously.
    const [submitted, setSubmitted] = useState(false);
    const frozen =
        groups.every(group => group.selectedOptionIndex !== undefined) ||
        submitted;
    const pickFor = (group: ChatQuickReplyQuestion, groupIndex: number) =>
        group.selectedOptionIndex ?? selections[groupIndex];
    const allAnswered = groups.every(
        (group, groupIndex) => pickFor(group, groupIndex) !== undefined,
    );

    const handleConfirm = useCallback(() => {
        // Only reachable while not frozen (the button is hidden once frozen), so no group has
        // `selectedOptionIndex` set yet - every pick comes from `selections`.
        setSubmitted(true);
        onConfirm(
            groups
                .map(
                    (group, groupIndex) =>
                        `${group.question} → ${group.options[selections[groupIndex]]}`,
                )
                .join('\n'),
            selections,
        );
    }, [groups, onConfirm, selections]);

    return (
        <Box sx={defaultStyles.quickReplyForm as SxProps<Theme>}>
            {groups.map((group, groupIndex) => {
                const pick = pickFor(group, groupIndex);
                return (
                    <FormControl
                        key={group.question}
                        sx={defaultStyles.quickReplyGroup as SxProps<Theme>}
                    >
                        <FormLabel
                            sx={
                                defaultStyles.quickReplyQuestion as SxProps<Theme>
                            }
                        >
                            {groups.length > 1
                                ? `${groupIndex + 1}. ${group.question}`
                                : group.question}
                        </FormLabel>
                        <RadioGroup
                            value={pick ?? ''}
                            onChange={e => {
                                // Frozen rows stay visually "normal" (not the greyed-out MUI
                                // disabled look) - this guard is what actually stops them from
                                // changing, since pointerEvents below only blocks mouse clicks,
                                // not keyboard input.
                                if (frozen) return;
                                setSelections(prev => ({
                                    ...prev,
                                    [groupIndex]: Number(e.target.value),
                                }));
                            }}
                            sx={frozen ? { pointerEvents: 'none' } : undefined}
                        >
                            {group.options.map((option, optionIndex) => (
                                <FormControlLabel
                                    key={option}
                                    value={optionIndex}
                                    control={
                                        <Radio
                                            size="small"
                                            icon={<RadioButtonUncheckedIcon />}
                                            checkedIcon={
                                                <CheckCircleIcon color="primary" />
                                            }
                                        />
                                    }
                                    label={option}
                                    sx={
                                        [
                                            defaultStyles.quickReplyOption,
                                            pick === optionIndex &&
                                                defaultStyles.quickReplyOptionSelected,
                                        ] as SxProps<Theme>
                                    }
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                );
            })}
            {!frozen && (
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<SendIcon sx={{ fontSize: 18 }} />}
                    disabled={!allAnswered}
                    onClick={handleConfirm}
                    sx={defaultStyles.quickReplySendButton as SxProps<Theme>}
                >
                    {formatMessage(MESSAGES.sendAnswers)}
                </Button>
            )}
        </Box>
    );
};

type MessageQuickRepliesProps = {
    message: ChatMessage;
    isLast: boolean;
    isLoading: boolean;
    onSendMessage: (message: string, options?: SendMessageOptions) => void;
};

// A message's quick-reply form stays visible once answered (so the picked answers remain readable
// on the original bubble), but is only interactive on the last message while nothing is loading.
const MessageQuickReplies: FC<MessageQuickRepliesProps> = ({
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

export const ChatPanel: FC<Props> = ({
    messages,
    isLoading,
    onSendMessage,
    emptyState,
    title,
    subtitle,
    badge,
    titleIcon,
    placeholder,
    interpretMarkdown = false,
    sx = {},
}) => {
    const { formatMessage } = useSafeIntl();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(() => {
        const trimmed = inputValue.trim();
        if (trimmed && !isLoading) {
            onSendMessage(trimmed);
            setInputValue('');
        }
    }, [inputValue, isLoading, onSendMessage]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const showEmptyState = messages.length === 0;

    return (
        <Box sx={[defaultStyles.root, sx.root] as SxProps<Theme>}>
            <Box sx={[defaultStyles.header, sx.header] as SxProps<Theme>}>
                <Box
                    sx={
                        [
                            defaultStyles.headerTitleRow,
                            sx.headerTitleRow,
                        ] as SxProps<Theme>
                    }
                >
                    {titleIcon}
                    <Typography
                        sx={
                            [
                                defaultStyles.headerTitle,
                                sx.headerTitle,
                            ] as SxProps<Theme>
                        }
                    >
                        {title}
                    </Typography>
                    {badge && (
                        <Box
                            component="span"
                            sx={
                                [
                                    defaultStyles.aiBadge,
                                    sx.aiBadge,
                                ] as SxProps<Theme>
                            }
                        >
                            {badge}
                        </Box>
                    )}
                </Box>
                {subtitle && (
                    <Typography
                        sx={
                            [
                                defaultStyles.headerSubtitle,
                                sx.headerSubtitle,
                            ] as SxProps<Theme>
                        }
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>

            <Box
                sx={
                    [
                        defaultStyles.messagesArea,
                        sx.messagesArea,
                    ] as SxProps<Theme>
                }
            >
                {showEmptyState && (
                    <Box
                        sx={
                            [
                                defaultStyles.emptyState,
                                sx.emptyState,
                            ] as SxProps<Theme>
                        }
                    >
                        {emptyState}
                    </Box>
                )}
                {messages.map((msg, messageIndex) => (
                    <Box key={msg.id} sx={messageRow(msg.role)}>
                        <Box sx={avatar(msg.role)}>
                            {msg.role === 'user' ? (
                                <PersonIcon sx={{ fontSize: 18 }} />
                            ) : (
                                <SmartToyIcon sx={{ fontSize: 18 }} />
                            )}
                        </Box>
                        <Paper elevation={0} sx={bubble(msg.role)}>
                            {interpretMarkdown && msg.role !== 'user' ? (
                                <Box
                                    sx={
                                        defaultStyles.markdownContent as SxProps<Theme>
                                    }
                                >
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </Box>
                            ) : (
                                <Typography
                                    variant="body2"
                                    sx={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {msg.content}
                                </Typography>
                            )}
                            <MessageQuickReplies
                                message={msg}
                                isLast={messageIndex === messages.length - 1}
                                isLoading={isLoading}
                                onSendMessage={onSendMessage}
                            />
                        </Paper>
                    </Box>
                ))}
                {isLoading && (
                    <Box
                        sx={
                            [
                                defaultStyles.loadingRow,
                                sx.loadingRow,
                            ] as SxProps<Theme>
                        }
                    >
                        <Box
                            sx={
                                [
                                    defaultStyles.loadingAvatar,
                                    sx.loadingAvatar,
                                ] as SxProps<Theme>
                            }
                        >
                            <SmartToyIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <CircularProgress size={20} />
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Box sx={[defaultStyles.inputArea, sx.inputArea] as SxProps<Theme>}>
                <Box
                    sx={
                        [
                            defaultStyles.inputContainer,
                            sx.inputContainer,
                        ] as SxProps<Theme>
                    }
                >
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        variant="outlined"
                        placeholder={
                            placeholder ?? formatMessage(MESSAGES.placeholder)
                        }
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        sx={
                            [
                                defaultStyles.inputField,
                                sx.inputField,
                            ] as SxProps<Theme>
                        }
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSend}
                        disabled={isLoading || !inputValue.trim()}
                        sx={
                            [
                                defaultStyles.sendButton,
                                sx.sendButton,
                            ] as SxProps<Theme>
                        }
                    >
                        <SendIcon sx={{ fontSize: 18 }} />
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};
