import React, { FC, ReactNode, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { IconButton, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { TeamType } from 'Iaso/domains/teams/constants';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { canHaveSubTeams, getToggledType } from 'Iaso/domains/teams/utils';
import { SxStyles } from 'Iaso/types/general';
import { DragHandle } from './DragHandle';
import { HierarchyRowLayout } from './HierarchyRowLayout';
import MESSAGES from './messages';
import { RowAction, RowActionsMenu } from './RowActionsMenu';
import { TEAM_TYPE_DISPLAY, TeamTypeIcon } from './teamType';
import { DraggedItem, HierarchyAction, TeamRowData } from './types';
import { teamKey } from './utils';

const styles = {
    name: {
        fontWeight: 600,
    },
    icon: {
        fontSize: '1.2rem',
    },
} satisfies SxStyles;

type TeamRowProps = {
    row: TeamRowData;
    onToggle: (teamId: number) => void;
    rowRef?: (element: HTMLElement | null) => void;
    handle?: ReactNode;
    menu?: ReactNode;
    isDropTarget?: boolean;
    isDragging?: boolean;
};

export const TeamRow: FC<TeamRowProps> = ({
    row: { team, depth, isExpanded },
    onToggle,
    rowRef,
    handle,
    menu,
    isDropTarget,
    isDragging,
}) => {
    const { formatMessage } = useSafeIntl();
    const hasContent = team.children.length > 0 || team.users.length > 0;
    const typeDisplay = team.type ? TEAM_TYPE_DISPLAY[team.type] : undefined;
    const handleToggle = useCallback(
        () => onToggle(team.id),
        [onToggle, team.id],
    );

    return (
        <HierarchyRowLayout
            depth={depth}
            rowRef={rowRef}
            isDropTarget={isDropTarget}
            isDragging={isDragging}
            handle={handle}
            toggle={
                hasContent && (
                    <IconButton size="small" onClick={handleToggle}>
                        {isExpanded ? (
                            <ExpandMoreIcon fontSize="small" />
                        ) : (
                            <ChevronRightIcon fontSize="small" />
                        )}
                    </IconButton>
                )
            }
        >
            <TeamTypeIcon type={team.type} color="primary" sx={styles.icon} />
            <Typography noWrap sx={styles.name}>
                {team.name}
            </Typography>
            {typeDisplay && (
                <>
                    <Typography variant="body2">
                        {formatMessage(typeDisplay.label)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {formatMessage(
                            typeDisplay.countLabel,
                            numericValues({
                                count: typeDisplay.getCount(team),
                            }),
                        )}
                    </Typography>
                </>
            )}
            {menu}
        </HierarchyRowLayout>
    );
};

type EditableTeamRowProps = {
    row: TeamRowData;
    canDropOn: (team: TeamTreeNode) => boolean;
    onToggle: (teamId: number) => void;
    onAction: (action: HierarchyAction) => void;
};

export const EditableTeamRow: FC<EditableTeamRowProps> = ({
    row,
    canDropOn,
    onToggle,
    onAction,
}) => {
    const { formatMessage } = useSafeIntl();
    const { team, depth } = row;
    const isRoot = depth === 0;
    const hasContent = team.children.length > 0 || team.users.length > 0;
    const draggedItem: DraggedItem = { kind: 'team', team };

    const {
        setNodeRef: setDraggableRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        isDragging,
    } = useDraggable({
        id: teamKey(team.id),
        data: draggedItem,
        disabled: isRoot,
    });
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `drop-${teamKey(team.id)}`,
        data: { team },
    });
    const rowRef = useCallback(
        (element: HTMLElement | null) => {
            setDraggableRef(element);
            setDroppableRef(element);
        },
        [setDraggableRef, setDroppableRef],
    );

    const actions: (RowAction | false)[] = [
        {
            key: 'rename',
            label: formatMessage(MESSAGES.rename),
            icon: <EditIcon fontSize="small" />,
            onClick: () => onAction({ kind: 'rename', team }),
        },
        {
            key: 'addSubTeam',
            label: formatMessage(MESSAGES.addSubTeam),
            icon: <GroupAddIcon fontSize="small" />,
            disabled: !canHaveSubTeams(team),
            onClick: () => onAction({ kind: 'addSubTeam', team }),
        },
        {
            key: 'changeType',
            label: formatMessage(
                getToggledType(team) === TeamType.TEAM_OF_TEAMS
                    ? MESSAGES.changeToTeamOfTeams
                    : MESSAGES.changeToTeamOfUsers,
            ),
            icon: <SwapHorizIcon fontSize="small" />,
            // The API rejects a type that contradicts existing sub-teams or users.
            disabled: hasContent,
            onClick: () => onAction({ kind: 'changeType', team }),
        },
        !isRoot && {
            key: 'move',
            label: formatMessage(MESSAGES.moveTo),
            icon: <DriveFileMoveIcon fontSize="small" />,
            onClick: () => onAction({ kind: 'move', item: draggedItem }),
        },
        !isRoot && {
            key: 'delete',
            label: formatMessage(MESSAGES.deleteTeam),
            icon: <DeleteIcon fontSize="small" />,
            danger: true,
            // Teams are soft-deleted: sub-teams would be orphaned out of the hierarchy.
            disabled: team.children.length > 0,
            onClick: () => onAction({ kind: 'delete', team }),
        },
    ];

    return (
        <TeamRow
            row={row}
            onToggle={onToggle}
            rowRef={rowRef}
            isDropTarget={isOver && canDropOn(team)}
            isDragging={isDragging}
            handle={
                !isRoot && (
                    <DragHandle
                        activatorRef={setActivatorNodeRef}
                        attributes={attributes}
                        listeners={listeners}
                    />
                )
            }
            menu={<RowActionsMenu actions={actions} />}
        />
    );
};
