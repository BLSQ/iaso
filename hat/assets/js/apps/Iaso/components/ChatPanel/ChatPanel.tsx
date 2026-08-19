import React, {
    ChangeEvent,
    FC,
    ReactElement,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import AddIcon from '@mui/icons-material/Add';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PersonIcon from '@mui/icons-material/Person';
import ReportIcon from '@mui/icons-material/Report';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Paper,
    SxProps,
    TextField,
    Theme,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import ReactMarkdown from 'react-markdown';
import { SxStyles } from 'Iaso/types/general';
import { MessageQuickReplies } from './MessageQuickReplies';
import MESSAGES from './messages';
import {
    ChatMessage,
    ChatMessageRole,
    PendingAttachment,
    PendingAttachmentStatus,
    QuickReplyAnswer,
    SendMessageOptions,
} from './types';

export * from './types';

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

const attachmentStatusIcon = (
    status: PendingAttachmentStatus,
): ReactElement => {
    if (status === 'uploading') {
        return (
            <Box>
                <CircularProgress size={16} sx={{ color: 'common.white' }} />
            </Box>
        );
    }
    if (status === 'error') {
        return <ReportIcon fontSize="small" />;
    }
    return <InsertDriveFileIcon fontSize="small" />;
};

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
    pendingAttachments?: PendingAttachment[];
    onAttachFiles?: (files: File[]) => void;
    onRemoveAttachment?: (id: string) => void;
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
    attachButton: {
        width: 40,
        height: 40,
        flexShrink: 0,
    },
    attachmentsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
    },
    pendingAttachmentsRow: {
        mb: 1,
        px: 0.5,
    },
    attachmentChip: {
        border: 'none',
        height: theme => theme.spacing(4),
        '& .MuiChip-icon': {
            color: 'common.white',
            margin: 0,
            width: theme => theme.spacing(4),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        '& .MuiChip-label': {
            pl: 0,
            ml: -0.25,
            fontWeight: 500,
        },
    },
    pendingAttachmentChipError: {
        bgcolor: 'error.light',
        color: 'error.contrastText',
    },
    messageAttachmentsRow: {
        mt: 1,
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
    pendingAttachments = [],
    onAttachFiles,
    onRemoveAttachment,
    sx = {},
}) => {
    const { formatMessage } = useSafeIntl();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const hasUploadingAttachment = pendingAttachments.some(
        attachment => attachment.status === 'uploading',
    );
    const hasReadyAttachment = pendingAttachments.some(
        attachment => attachment.status === 'ready',
    );

    const handleSend = useCallback(() => {
        const trimmed = inputValue.trim();
        const readyAttachments = pendingAttachments
            .filter(attachment => attachment.status === 'ready')
            .map(({ id, filename }) => ({ id, filename }));
        if (
            (trimmed || readyAttachments.length > 0) &&
            !isLoading &&
            !hasUploadingAttachment
        ) {
            onSendMessage(
                trimmed || formatMessage(MESSAGES.defaultAttachmentMessage),
                readyAttachments.length
                    ? { attachments: readyAttachments }
                    : undefined,
            );
            setInputValue('');
        }
    }, [
        inputValue,
        isLoading,
        hasUploadingAttachment,
        pendingAttachments,
        onSendMessage,
        formatMessage,
    ]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const handleFileInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files ? Array.from(e.target.files) : [];
            // Reset so picking the exact same file again still fires a change event.
            e.target.value = '';
            if (files.length > 0) {
                onAttachFiles?.(files);
            }
        },
        [onAttachFiles],
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
                            {msg.attachments && msg.attachments.length > 0 && (
                                <Box
                                    sx={
                                        [
                                            defaultStyles.attachmentsRow,
                                            defaultStyles.messageAttachmentsRow,
                                        ] as SxProps<Theme>
                                    }
                                >
                                    {msg.attachments.map(attachment => (
                                        <Chip
                                            key={attachment.id}
                                            variant="outlined"
                                            icon={
                                                <InsertDriveFileIcon fontSize="small" />
                                            }
                                            label={attachment.filename}
                                            sx={
                                                defaultStyles.attachmentChip as SxProps<Theme>
                                            }
                                        />
                                    ))}
                                </Box>
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
                {onAttachFiles && pendingAttachments.length > 0 && (
                    <Box
                        sx={
                            [
                                defaultStyles.attachmentsRow,
                                defaultStyles.pendingAttachmentsRow,
                            ] as SxProps<Theme>
                        }
                    >
                        {pendingAttachments.map(attachment => (
                            <Chip
                                key={attachment.id}
                                icon={attachmentStatusIcon(attachment.status)}
                                label={attachment.filename}
                                onDelete={
                                    onRemoveAttachment
                                        ? () =>
                                              onRemoveAttachment(attachment.id)
                                        : undefined
                                }
                                sx={
                                    [
                                        defaultStyles.attachmentChip,
                                        attachment.status === 'error' &&
                                            defaultStyles.pendingAttachmentChipError,
                                    ] as SxProps<Theme>
                                }
                            />
                        ))}
                    </Box>
                )}
                <Box
                    sx={
                        [
                            defaultStyles.inputContainer,
                            sx.inputContainer,
                        ] as SxProps<Theme>
                    }
                >
                    {onAttachFiles && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                multiple
                                hidden
                                onChange={handleFileInputChange}
                            />
                            <IconButton
                                aria-label={formatMessage(MESSAGES.attachFile)}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                sx={
                                    defaultStyles.attachButton as SxProps<Theme>
                                }
                            >
                                <AddIcon />
                            </IconButton>
                        </>
                    )}
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
                        disabled={
                            isLoading ||
                            hasUploadingAttachment ||
                            (!inputValue.trim() && !hasReadyAttachment)
                        }
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
