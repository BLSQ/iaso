import React, { FC } from 'react';
import {
    DraggableAttributes,
    DraggableSyntheticListeners,
} from '@dnd-kit/core';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const styles = {
    handle: {
        display: 'flex',
        color: 'text.disabled',
        cursor: 'grab',
        touchAction: 'none',
        '&:hover': { color: 'text.secondary' },
    },
    icon: {
        fontSize: '1.1rem',
    },
} satisfies SxStyles;

type Props = {
    activatorRef: (element: HTMLElement | null) => void;
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners;
};

export const DragHandle: FC<Props> = ({
    activatorRef,
    attributes,
    listeners,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box
            ref={activatorRef}
            sx={styles.handle}
            {...attributes}
            {...listeners}
            aria-label={formatMessage(MESSAGES.dragToMove)}
        >
            <DragIndicatorIcon sx={styles.icon} />
        </Box>
    );
};
