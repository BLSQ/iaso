import React, { FunctionComponent, ReactNode } from 'react';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { ValidationQueue, ValidationWorkflowInstanceCounts } from '../types';

type QueueKey = 'all' | ValidationQueue;

type Tile = {
    key: QueueKey;
    label: { id: string; defaultMessage: string };
    icon?: ReactNode;
    accentColor?: string;
};

const TILES: Tile[] = [
    { key: 'all', label: MESSAGES.queueAll },
    {
        key: 'awaiting_my_action',
        label: MESSAGES.queueAwaitingMyAction,
        icon: <PersonIcon fontSize="inherit" />,
    },
    {
        key: 'awaiting_others',
        label: MESSAGES.queueAwaitingOthers,
        icon: <GroupsIcon fontSize="inherit" />,
    },
    {
        key: 'handled_by_me',
        label: MESSAGES.queueHandledByMe,
        icon: <CheckIcon fontSize="inherit" color="success" />,
        accentColor: 'success.main',
    },
    {
        key: 'rejected',
        label: MESSAGES.queueRejected,
        icon: <CancelIcon fontSize="inherit" color="error" />,
        accentColor: 'error.main',
    },
];

const styles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
    },
    title: {
        mr: 1,
    },
    tile: {
        flex: '1 1 160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        borderBottomWidth: 3,
        backgroundColor: 'background.paper',
        textAlign: 'left',
    },
    selectedTile: {
        borderColor: 'text.primary',
        borderWidth: 2,
        borderBottomWidth: 3,
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        fontSize: '0.85rem',
        color: 'text.secondary',
    },
    count: {
        fontWeight: 500,
    },
} satisfies SxStyles;

type Props = {
    selectedQueue?: ValidationQueue;
    counts?: ValidationWorkflowInstanceCounts;
    isLoading?: boolean;
    onChange: (queue?: ValidationQueue) => void;
};

export const QueueTiles: FunctionComponent<Props> = ({
    selectedQueue,
    counts,
    isLoading = false,
    onChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const selectedKey: QueueKey = selectedQueue ?? 'all';
    return (
        <Box sx={styles.root} role="tablist" data-testid="queue-tiles">
            <Typography variant="body2" sx={styles.title}>
                {formatMessage(MESSAGES.title)}
            </Typography>
            {TILES.map(tile => {
                const isSelected = tile.key === selectedKey;
                return (
                    <ButtonBase
                        key={tile.key}
                        role="tab"
                        aria-selected={isSelected}
                        data-testid={`queue-tile-${tile.key}`}
                        onClick={() =>
                            onChange(
                                tile.key === 'all'
                                    ? undefined
                                    : (tile.key as ValidationQueue),
                            )
                        }
                        sx={{
                            ...styles.tile,
                            ...(isSelected ? styles.selectedTile : {}),
                            ...(tile.accentColor
                                ? { borderBottomColor: tile.accentColor }
                                : {}),
                        }}
                    >
                        <Box component="span" sx={styles.label}>
                            {tile.icon}
                            {formatMessage(tile.label)}
                        </Box>
                        <Typography component="span" sx={styles.count}>
                            {isLoading || !counts ? (
                                <Skeleton width={24} />
                            ) : (
                                counts[tile.key]
                            )}
                        </Typography>
                    </ButtonBase>
                );
            })}
        </Box>
    );
};
