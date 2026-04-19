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

export const ChatPanel: FunctionComponent<Props> = ({
    messages,
    isLoading,
    onSendMessage,
}) => {
    const { formatMessage } = useSafeIntl();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

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
        <Paper
            elevation={1}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Messages area */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {messages.length === 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary',
                        }}
                    >
                        <Typography variant="body1">
                            {formatMessage(MESSAGES.placeholder)}
                        </Typography>
                    </Box>
                )}
                {messages.map((msg, index) => (
                    <Box
                        key={`msg-${index}`}
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'flex-start',
                            flexDirection:
                                msg.role === 'user' ? 'row-reverse' : 'row',
                        }}
                    >
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor:
                                    msg.role === 'user'
                                        ? 'primary.main'
                                        : 'grey.300',
                                color:
                                    msg.role === 'user'
                                        ? 'primary.contrastText'
                                        : 'text.primary',
                                flexShrink: 0,
                            }}
                        >
                            {msg.role === 'user' ? (
                                <PersonIcon sx={{ fontSize: 18 }} />
                            ) : (
                                <SmartToyIcon sx={{ fontSize: 18 }} />
                            )}
                        </Box>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                maxWidth: '80%',
                                bgcolor:
                                    msg.role === 'user'
                                        ? 'primary.light'
                                        : 'grey.100',
                                color:
                                    msg.role === 'user'
                                        ? 'primary.contrastText'
                                        : 'text.primary',
                                borderRadius: 2,
                            }}
                        >
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
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'grey.300',
                                flexShrink: 0,
                            }}
                        >
                            <SmartToyIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <CircularProgress size={20} />
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input area */}
            <Box
                sx={{
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    gap: 1,
                }}
            >
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
                    sx={{ minWidth: 'auto', px: 2 }}
                >
                    <SendIcon />
                </Button>
            </Box>
        </Paper>
    );
};
