import React, { FC, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsIcon from '@mui/icons-material/Groups';
import { IconButton, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { TEAM_OF_TEAMS, TEAM_OF_USERS } from 'Iaso/domains/teams/constants';
import { canHaveSubTeams } from 'Iaso/domains/teams/utils';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { DragHandle } from './DragHandle';
import { HierarchyRowLayout } from './HierarchyRowLayout';
import { RowAction, RowActionsMenu } from './RowActionsMenu';
import { DraggedItem, HierarchyTeam, TeamNode, TeamRowData } from './types';
import { teamKey } from './utils';

const styles = {
    name: {
        fontWeight: 600,
    },
    icon: {
        fontSize: '1.2rem',
    },
} satisfies SxStyles;

const TEAM_TYPE_DISPLAY = {
    [TEAM_OF_TEAMS]: {
        label: MESSAGES.teamOfTeams,
        countLabel: MESSAGES.teamsCount,
        getCount: (node: TeamNode) => node.children.length,
    },
    [TEAM_OF_USERS]: {
        label: MESSAGES.teamOfUsers,
        countLabel: MESSAGES.usersCount,
        getCount: (node: TeamNode) => node.team.users_details?.length ?? 0,
    },
};

type Props = {
    row: TeamRowData;
    canDropOn: (team: HierarchyTeam) => boolean;
    onToggle: (teamId: number) => void;
    onAddSubTeam: (team: HierarchyTeam) => void;
    onEdit: (team: HierarchyTeam) => void;
    onRemoveFromHierarchy: (team: HierarchyTeam) => void;
};

export const TeamRow: FC<Props> = ({
    row: { node, depth, isExpanded },
    canDropOn,
    onToggle,
    onAddSubTeam,
    onEdit,
    onRemoveFromHierarchy,
}) => {
    const { formatMessage } = useSafeIntl();
    const { team, children } = node;
    const isRoot = depth === 0;
    const hasContent =
        children.length > 0 || (team.users_details?.length ?? 0) > 0;
    const typeDisplay = team.type ? TEAM_TYPE_DISPLAY[team.type] : undefined;

    const {
        setNodeRef: setDraggableRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        isDragging,
    } = useDraggable({
        id: teamKey(team.id),
        data: { kind: 'team', team } satisfies DraggedItem,
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
    const handleToggle = useCallback(
        () => onToggle(team.id),
        [onToggle, team.id],
    );

    const actions = [
        canHaveSubTeams(team) && {
            key: 'addSubTeam',
            label: formatMessage(MESSAGES.addSubTeam),
            onClick: () => onAddSubTeam(team),
        },
        {
            key: 'edit',
            label: formatMessage(MESSAGES.editTeam),
            onClick: () => onEdit(team),
        },
        !isRoot && {
            key: 'removeFromHierarchy',
            label: formatMessage(MESSAGES.removeFromHierarchy),
            onClick: () => onRemoveFromHierarchy(team),
        },
    ].filter((action): action is RowAction => Boolean(action));

    return (
        <HierarchyRowLayout
            depth={depth}
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
            {team.type === TEAM_OF_USERS ? (
                <GroupsIcon color="primary" sx={styles.icon} />
            ) : (
                <AccountTreeIcon color="primary" sx={styles.icon} />
            )}
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
                                count: typeDisplay.getCount(node),
                            }),
                        )}
                    </Typography>
                </>
            )}
            <RowActionsMenu actions={actions} />
        </HierarchyRowLayout>
    );
};
