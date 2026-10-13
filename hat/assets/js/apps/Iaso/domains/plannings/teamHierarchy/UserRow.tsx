import React, { FC } from 'react';
import { useDraggable } from '@dnd-kit/core';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
import { DragHandle } from './DragHandle';
import { HierarchyRowLayout } from './HierarchyRowLayout';
import { RowActionsMenu } from './RowActionsMenu';
import { DraggedItem, UserRowData } from './types';
import { userKey } from './utils';

const styles = {
    icon: {
        fontSize: '1.2rem',
        color: 'text.secondary',
    },
} satisfies SxStyles;

type Props = {
    row: UserRowData;
    onRemoveFromTeam: (row: UserRowData) => void;
};

export const UserRow: FC<Props> = ({ row, onRemoveFromTeam }) => {
    const { formatMessage } = useSafeIntl();
    const { user, team, depth } = row;

    const {
        setNodeRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        isDragging,
    } = useDraggable({
        id: userKey(team.id, user.id),
        data: { kind: 'user', user, team } satisfies DraggedItem,
    });

    const actions = [
        {
            key: 'removeFromTeam',
            label: formatMessage(MESSAGES.removeFromTeam),
            onClick: () => onRemoveFromTeam(row),
        },
    ];

    return (
        <HierarchyRowLayout
            depth={depth}
            rowRef={setNodeRef}
            isDragging={isDragging}
            handle={
                <DragHandle
                    activatorRef={setActivatorNodeRef}
                    attributes={attributes}
                    listeners={listeners}
                />
            }
        >
            <PersonOutlineIcon sx={styles.icon} />
            <Typography variant="body2" noWrap>
                {getDisplayName(user)}
            </Typography>
            <RowActionsMenu actions={actions} />
        </HierarchyRowLayout>
    );
};
