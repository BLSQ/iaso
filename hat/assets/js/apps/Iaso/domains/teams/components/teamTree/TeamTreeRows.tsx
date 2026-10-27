import React, { FC, useCallback, useMemo, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Paper, Typography } from '@mui/material';
import { TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { SxStyles } from 'Iaso/types/general';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import { EditableTeamRow, TeamRow } from './TeamRow';
import { DraggedItem, HierarchyAction, HierarchyRow } from './types';
import { EditableUserRow, UserRow } from './UserRow';
import { canDrop, getDropExcludedTeamIds, teamKey, userKey } from './utils';

const styles = {
    dragOverlay: {
        px: 2,
        py: 1,
        display: 'inline-block',
        cursor: 'grabbing',
    },
} satisfies SxStyles;

type Props = {
    rows: HierarchyRow[];
    onToggle: (teamId: number) => void;
};

export const TeamTreeRows: FC<Props> = ({ rows, onToggle }) => (
    <>
        {rows.map(row =>
            row.kind === 'team' ? (
                <TeamRow
                    key={teamKey(row.team.id)}
                    row={row}
                    onToggle={onToggle}
                />
            ) : (
                <UserRow key={userKey(row.team.id, row.user.id)} row={row} />
            ),
        )}
    </>
);

type EditableProps = Props & {
    onMove: (item: DraggedItem, target: TeamTreeNode) => void;
    onAction: (action: HierarchyAction) => void;
};

export const EditableTeamTreeRows: FC<EditableProps> = ({
    rows,
    onMove,
    onToggle,
    onAction,
}) => {
    const [draggedItem, setDraggedItem] = useState<DraggedItem>();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor),
    );
    const canDropOn = useMemo(() => {
        if (!draggedItem) return () => false;
        const excludedTeamIds = getDropExcludedTeamIds(draggedItem);
        return (target: TeamTreeNode) =>
            canDrop(draggedItem, target, excludedTeamIds);
    }, [draggedItem]);

    const handleDragStart = useCallback(
        ({ active }: DragStartEvent) =>
            setDraggedItem(active.data.current as DraggedItem),
        [],
    );
    const handleDragCancel = useCallback(() => setDraggedItem(undefined), []);
    const handleDragEnd = useCallback(
        ({ over }: DragEndEvent) => {
            setDraggedItem(undefined);
            const target: TeamTreeNode | undefined = over?.data.current?.team;
            if (draggedItem && target && canDropOn(target)) {
                onMove(draggedItem, target);
            }
        },
        [draggedItem, canDropOn, onMove],
    );

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            {rows.map(row =>
                row.kind === 'team' ? (
                    <EditableTeamRow
                        key={teamKey(row.team.id)}
                        row={row}
                        canDropOn={canDropOn}
                        onToggle={onToggle}
                        onAction={onAction}
                    />
                ) : (
                    <EditableUserRow
                        key={userKey(row.team.id, row.user.id)}
                        row={row}
                        onAction={onAction}
                    />
                ),
            )}
            <DragOverlay>
                {draggedItem && (
                    <Paper elevation={4} sx={styles.dragOverlay}>
                        <Typography fontWeight={600}>
                            {draggedItem.kind === 'team'
                                ? draggedItem.team.name
                                : getDisplayName(draggedItem.user)}
                        </Typography>
                    </Paper>
                )}
            </DragOverlay>
        </DndContext>
    );
};
