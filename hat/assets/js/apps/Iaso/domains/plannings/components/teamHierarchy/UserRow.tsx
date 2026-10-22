import React, { FC } from 'react';
import { useDraggable } from '@dnd-kit/core';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import MESSAGES from '../../messages';
import { DragHandle } from './DragHandle';
import { HierarchyRowLayout } from './HierarchyRowLayout';
import { RowAction, RowActionsMenu } from './RowActionsMenu';
import { DraggedItem, HierarchyAction, UserRowData } from './types';
import { userKey } from './utils';

const styles = {
    icon: {
        fontSize: '1.2rem',
        color: 'text.secondary',
    },
} satisfies SxStyles;

type Props = {
    row: UserRowData;
    onAction: (action: HierarchyAction) => void;
};

export const UserRow: FC<Props> = ({
    row: { user, team, depth },
    onAction,
}) => {
    const { formatMessage } = useSafeIntl();

    const draggedItem: DraggedItem = { kind: 'user', user, team };
    const {
        setNodeRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        isDragging,
    } = useDraggable({
        id: userKey(team.id, user.id),
        data: draggedItem,
    });

    const actions: RowAction[] = [
        {
            key: 'move',
            label: formatMessage(MESSAGES.moveTo),
            icon: <DriveFileMoveIcon fontSize="small" />,
            onClick: () => onAction({ kind: 'move', item: draggedItem }),
        },
        {
            key: 'removeFromTeam',
            label: formatMessage(MESSAGES.removeFromTeam),
            icon: <PersonRemoveIcon fontSize="small" />,
            danger: true,
            onClick: () => onAction({ kind: 'removeUser', user, team }),
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
