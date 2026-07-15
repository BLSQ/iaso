import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    SxProps,
    TextField,
    Theme,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

type MessageRole = 'user' | 'assistant';

type Message = {
    role: MessageRole;
    content: string;
    id: string;
};

const FORM_AI_PURPLE = '#6366F1';

const messageRow = (role: MessageRole): SxProps<Theme> => ({
    display: 'flex',
    gap: 1,
    alignItems: 'flex-start',
    flexDirection: role === 'user' ? 'row-reverse' : 'row',
});

const avatar = (role: MessageRole): SxProps<Theme> => ({
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

const bubble = (role: MessageRole): SxProps<Theme> => ({
    p: 1.5,
    maxWidth: '80%',
    bgcolor: role === 'user' ? 'primary.light' : 'grey.100',
    color: role === 'user' ? 'primary.contrastText' : 'text.primary',
    borderRadius: 2,
});

type Props = {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
};

const styles: SxStyles = {
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: theme => `1px solid ${theme.palette.divider}`,
    },
    header: {
        px: 2,
        pt: 2,
        pb: 1.5,
        height: '80px',
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
    },
    headerTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        mb: 0.5,
    },
    headerIcon: {
        fontSize: 20,
        color: FORM_AI_PURPLE,
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
        bgcolor: '#EEF2FF',
        color: FORM_AI_PURPLE,
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
    emptyStateIconBox: {
        width: 56,
        height: 56,
        borderRadius: 2,
        bgcolor: '#EEF2FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 0.5,
    },
    emptyStateIcon: {
        fontSize: 28,
        color: FORM_AI_PURPLE,
    },
    emptyStateTitle: {
        fontWeight: 700,
        color: 'text.primary',
    },
    emptyStateDescription: {
        color: 'text.secondary',
        maxWidth: 280,
        lineHeight: 1.5,
    },
    examples: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: '100%',
        maxWidth: 320,
        mt: 1,
    },
    exampleSentence: {
        bgcolor: 'grey.100',
        borderRadius: 2,
        px: 2,
        py: 1.25,
        color: 'text.secondary',
        fontSize: '0.8125rem',
        lineHeight: 1.4,
        textAlign: 'left',
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
        borderRadius: 999,
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
};

export const ChatPanel: FunctionComponent<Props> = ({
    messages,
    isLoading,
    onSendMessage,
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
        <Box sx={styles.root}>
            <Box sx={styles.header}>
                <Box sx={styles.headerTitleRow}>
                    <AutoAwesomeIcon sx={styles.headerIcon} />
                    <Typography sx={styles.headerTitle}>
                        {formatMessage(MESSAGES.brandName)}
                    </Typography>
                    <Box component="span" sx={styles.aiBadge}>
                        {formatMessage(MESSAGES.aiBadge)}
                    </Box>
                </Box>
                <Typography sx={styles.headerSubtitle}>
                    {formatMessage(MESSAGES.panelSubtitle)}
                </Typography>
            </Box>

            <Box sx={styles.messagesArea}>
                {showEmptyState && (
                    <Box sx={styles.emptyState}>
                        <Box sx={styles.emptyStateIconBox}>
                            <AutoAwesomeIcon sx={styles.emptyStateIcon} />
                        </Box>
                        <Typography variant="body1" sx={styles.emptyStateTitle}>
                            {formatMessage(MESSAGES.emptyStateTitle)}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={styles.emptyStateDescription}
                        >
                            {formatMessage(MESSAGES.emptyStateDescription)}
                        </Typography>
                        <Box sx={styles.examples}>
                            <Typography sx={styles.exampleSentence}>
                                « {formatMessage(MESSAGES.exampleStock)} »
                            </Typography>
                            <Typography sx={styles.exampleSentence}>
                                « {formatMessage(MESSAGES.exampleSurvey)} »
                            </Typography>
                        </Box>
                    </Box>
                )}
                {messages.map(msg => (
                    <Box key={msg.id} sx={messageRow(msg.role)}>
                        <Box sx={avatar(msg.role)}>
                            {msg.role === 'user' ? (
                                <PersonIcon sx={{ fontSize: 18 }} />
                            ) : (
                                <SmartToyIcon sx={{ fontSize: 18 }} />
                            )}
                        </Box>
                        <Paper elevation={0} sx={bubble(msg.role)}>
                            <Typography
                                variant="body2"
                                sx={{ whiteSpace: 'pre-wrap' }}
                            >
                                {msg.content}
                            </Typography>
                        </Paper>
                    </Box>
                ))}
                {isLoading && (
                    <Box sx={styles.loadingRow}>
                        <Box sx={styles.loadingAvatar}>
                            <SmartToyIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <CircularProgress size={20} />
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Box sx={styles.inputArea}>
                <Box sx={styles.inputContainer}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        variant="outlined"
                        placeholder={formatMessage(MESSAGES.placeholder)}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        sx={styles.inputField}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSend}
                        disabled={isLoading || !inputValue.trim()}
                        sx={styles.sendButton}
                    >
                        <SendIcon sx={{ fontSize: 18 }} />
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};
