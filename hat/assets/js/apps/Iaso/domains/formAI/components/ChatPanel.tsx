import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type Props = {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
};

const styles: SxStyles = {
    paper: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'text.secondary',
    },
    messageRow: (role: 'user' | 'assistant') => ({
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        flexDirection: role === 'user' ? 'row-reverse' : 'row',
    }),
    avatar: (role: 'user' | 'assistant') => ({
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: role === 'user' ? 'primary.main' : 'grey.300',
        color: role === 'user' ? 'primary.contrastText' : 'text.primary',
        flexShrink: 0,
    }),
    bubble: (role: 'user' | 'assistant') => ({
        p: 1.5,
        maxWidth: '80%',
        bgcolor: role === 'user' ? 'primary.light' : 'grey.100',
        color: role === 'user' ? 'primary.contrastText' : 'text.primary',
        borderRadius: 2,
    }),
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
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        gap: 1,
    },
    sendButton: {
        minWidth: 'auto',
        px: 2,
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

    return (
        <Paper elevation={1} sx={styles.paper}>
            <Box sx={styles.messagesArea}>
                {messages.length === 0 && (
                    <Box sx={styles.emptyState}>
                        <Typography variant="body1">
                            {formatMessage(MESSAGES.placeholder)}
                        </Typography>
                    </Box>
                )}
                {messages.map((msg, index) => (
                    <Box
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        sx={styles.messageRow(msg.role)}
                    >
                        <Box sx={styles.avatar(msg.role)}>
                            {msg.role === 'user' ? (
                                <PersonIcon sx={{ fontSize: 18 }} />
                            ) : (
                                <SmartToyIcon sx={{ fontSize: 18 }} />
                            )}
                        </Box>
                        <Paper elevation={0} sx={styles.bubble(msg.role)}>
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
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    size="small"
                    placeholder={formatMessage(MESSAGES.placeholder)}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />
                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    sx={styles.sendButton}
                >
                    <SendIcon />
                </Button>
            </Box>
        </Paper>
    );
};
