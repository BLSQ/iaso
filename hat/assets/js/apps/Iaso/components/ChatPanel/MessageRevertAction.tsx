import React, { FC, useCallback, useState } from 'react';
import UndoIcon from '@mui/icons-material/Undo';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { ChatMessage } from './ChatPanel';
import MESSAGES from './messages';

type Props = {
    message: ChatMessage;
    isLoading: boolean;
    onRevert: (messageId: string) => void;
};

const styles = {
    root: {
        mt: 0.5,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    button: {
        p: 0.25,
        color: 'text.secondary',
    },
    revertedNote: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        color: 'text.disabled',
        fontStyle: 'italic',
    },
    revertedIcon: {
        fontSize: 14,
    },
} satisfies SxStyles;

// A discreet, icon-only "revert" affordance in the bottom-right of an assistant bubble whose turn
// applied an undoable change. Confirms first (the revert can't be undone and cascades to every later
// turn), then collapses to a plain "Reverted" note.
export const MessageRevertAction: FC<Props> = ({
    message,
    isLoading,
    onRevert,
}) => {
    const { formatMessage } = useSafeIntl();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const openConfirm = useCallback(() => setConfirmOpen(true), []);
    const closeConfirm = useCallback(() => setConfirmOpen(false), []);
    const noop = useCallback(() => null, []);
    const handleConfirm = useCallback(() => {
        if (isLoading) {
            return;
        }
        setConfirmOpen(false);
        onRevert(message.id);
    }, [isLoading, onRevert, message.id]);

    if (message.role !== 'assistant' || !message.revertable) {
        return null;
    }

    if (message.reverted) {
        return (
            <Box sx={styles.root}>
                <Typography variant="caption" sx={styles.revertedNote}>
                    <UndoIcon sx={styles.revertedIcon} />
                    {formatMessage(MESSAGES.reverted)}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={styles.root}>
            <Tooltip title={formatMessage(MESSAGES.revert)}>
                <span>
                    <IconButton
                        size="small"
                        aria-label={formatMessage(MESSAGES.revert)}
                        disabled={isLoading}
                        onClick={openConfirm}
                        sx={styles.button}
                    >
                        <UndoIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <ConfirmCancelModal
                open={confirmOpen}
                closeDialog={closeConfirm}
                onClose={noop}
                onConfirm={handleConfirm}
                onCancel={closeConfirm}
                allowConfirm={!isLoading}
                confirmMessage={MESSAGES.revertConfirmAccept}
                cancelMessage={MESSAGES.revertConfirmCancel}
                titleMessage={formatMessage(MESSAGES.revertConfirmTitle)}
                maxWidth="xs"
                id={`revert-confirm-${message.id}`}
                dataTestId={`revert-confirm-${message.id}`}
            >
                <Typography>
                    {formatMessage(MESSAGES.revertConfirmMessage)}
                </Typography>
            </ConfirmCancelModal>
        </Box>
    );
};
