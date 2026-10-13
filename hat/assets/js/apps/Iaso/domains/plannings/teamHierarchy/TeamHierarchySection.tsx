import React, {
    FC,
    useCallback,
    useDeferredValue,
    useMemo,
    useState,
} from 'react';
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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { CreateEditTeam } from 'Iaso/domains/teams/components/CreateEditTeam';
import { Team } from 'Iaso/domains/teams/types/team';
import { canHaveSubTeams, getToggledType } from 'Iaso/domains/teams/utils';
import { SxStyles } from 'Iaso/types/general';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import { PlanningStepCard } from '../components/PlanningStepCard';
import { usePlanningContext } from '../contexts/PlanningContext';
import MESSAGES from '../messages';
import { HierarchyRowLayout } from './HierarchyRowLayout';
import { HierarchyToolbar } from './HierarchyToolbar';
import {
    DeleteTeamDialog,
    MoveToDialog,
    RenameTeamDialog,
} from './TeamActionDialogs';
import { TeamRow } from './TeamRow';
import { DraggedItem, HierarchyAction, HierarchyTeam } from './types';
import { UserRow } from './UserRow';
import {
    useGetTeamHierarchy,
    useDeleteHierarchyTeam,
    useMoveUser,
    useRefreshTeamHierarchy,
    useUpdateTeam,
} from './useTeamHierarchy';
import {
    buildTeamTree,
    canDrop,
    collectTeamIds,
    countTeamsAndUsers,
    flattenTeamTree,
    getDropExcludedTeamIds,
    getMoveTargets,
    getSearchMatches,
} from './utils';

const styles = {
    hint: {
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.secondary',
    },
    hintIcon: {
        fontSize: '1rem',
    },
    emptyMessage: {
        p: 2,
    },
    dragOverlay: {
        px: 2,
        py: 1,
        display: 'inline-block',
        cursor: 'grabbing',
    },
} satisfies SxStyles;

type HierarchyDialog =
    | { kind: 'create'; parent: HierarchyTeam }
    | Extract<HierarchyAction, { kind: 'rename' | 'delete' | 'move' }>;

type Props = {
    rootTeamId: number;
    projectId?: number;
};

const TeamHierarchy: FC<Props> = ({ rootTeamId, projectId }) => {
    const { formatMessage } = useSafeIntl();
    const { data: teams = [], isLoading } = useGetTeamHierarchy(rootTeamId);
    const refreshHierarchy = useRefreshTeamHierarchy(rootTeamId);
    const { mutate: updateTeam } = useUpdateTeam(rootTeamId);
    const { mutate: moveUser } = useMoveUser(rootTeamId);
    const { mutate: deleteTeam } = useDeleteHierarchyTeam(rootTeamId);

    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [expandedTeamIds, setExpandedTeamIds] = useState(
        () => new Set([rootTeamId]),
    );
    const [draggedItem, setDraggedItem] = useState<DraggedItem>();
    const [dialog, setDialog] = useState<HierarchyDialog>();

    const tree = useMemo(
        () => buildTeamTree(teams, rootTeamId),
        [teams, rootTeamId],
    );
    const rows = useMemo(() => {
        if (!tree) return [];
        const visibleKeys = deferredSearch
            ? getSearchMatches(tree, deferredSearch)
            : undefined;
        return flattenTeamTree(tree, expandedTeamIds, visibleKeys);
    }, [tree, deferredSearch, expandedTeamIds]);
    const { teamsCount, usersCount } = useMemo(
        () =>
            tree ? countTeamsAndUsers(tree) : { teamsCount: 0, usersCount: 0 },
        [tree],
    );

    const expandTeam = useCallback(
        (teamId: number) =>
            setExpandedTeamIds(previous => new Set(previous).add(teamId)),
        [],
    );
    const toggleTeam = useCallback((teamId: number) => {
        setExpandedTeamIds(previous => {
            const next = new Set(previous);
            if (next.has(teamId)) {
                next.delete(teamId);
            } else {
                next.add(teamId);
            }
            return next;
        });
    }, []);
    const expandAll = useCallback(() => {
        if (tree) setExpandedTeamIds(new Set(collectTeamIds(tree)));
    }, [tree]);
    const collapseAll = useCallback(
        () => setExpandedTeamIds(new Set([rootTeamId])),
        [rootTeamId],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor),
    );
    const dropExcludedTeamIds = useMemo(
        () =>
            tree && draggedItem
                ? getDropExcludedTeamIds(tree, draggedItem)
                : new Set<number>(),
        [tree, draggedItem],
    );
    const canDropOn = useCallback(
        (target: HierarchyTeam) =>
            Boolean(
                draggedItem &&
                canDrop(draggedItem, target, dropExcludedTeamIds),
            ),
        [draggedItem, dropExcludedTeamIds],
    );
    const handleDragStart = useCallback(
        ({ active }: DragStartEvent) =>
            setDraggedItem(active.data.current as DraggedItem),
        [],
    );
    const handleDragCancel = useCallback(() => setDraggedItem(undefined), []);
    const moveItem = useCallback(
        (item: DraggedItem, target: HierarchyTeam) => {
            if (item.kind === 'team') {
                updateTeam({
                    teamId: item.team.id,
                    changes: { parent: target.id },
                });
            } else {
                moveUser({ userId: item.user.id, from: item.team, to: target });
            }
            expandTeam(target.id);
        },
        [updateTeam, moveUser, expandTeam],
    );
    const handleDragEnd = useCallback(
        ({ over }: DragEndEvent) => {
            setDraggedItem(undefined);
            const target: HierarchyTeam | undefined = over?.data.current?.team;
            if (draggedItem && target && canDropOn(target)) {
                moveItem(draggedItem, target);
            }
        },
        [draggedItem, canDropOn, moveItem],
    );

    const openCreateDialog = useCallback(
        (parent: HierarchyTeam) => setDialog({ kind: 'create', parent }),
        [],
    );
    const openRootCreateDialog = useCallback(() => {
        if (tree) openCreateDialog(tree.team);
    }, [tree, openCreateDialog]);
    const closeDialog = useCallback(() => setDialog(undefined), []);
    const handleTeamCreated = useCallback(
        (team: Team) => {
            refreshHierarchy();
            if (team.parent) expandTeam(team.parent);
        },
        [refreshHierarchy, expandTeam],
    );

    const handleAction = useCallback(
        (action: HierarchyAction) => {
            switch (action.kind) {
                case 'addSubTeam':
                    openCreateDialog(action.team);
                    break;
                case 'changeType':
                    updateTeam({
                        teamId: action.team.id,
                        changes: { type: getToggledType(action.team) },
                    });
                    break;
                case 'removeUser':
                    moveUser({ userId: action.user.id, from: action.team });
                    break;
                case 'rename':
                case 'delete':
                case 'move':
                    setDialog(action);
                    break;
            }
        },
        [openCreateDialog, updateTeam, moveUser],
    );

    return (
        <PlanningStepCard
            step={2}
            title={formatMessage(MESSAGES.teamHierarchy)}
            description={[
                formatMessage(MESSAGES.teamHierarchyInfos),
                formatMessage(
                    MESSAGES.teamsCount,
                    numericValues({ count: teamsCount }),
                ),
                formatMessage(
                    MESSAGES.usersCount,
                    numericValues({ count: usersCount }),
                ),
            ].join(' · ')}
            actions={
                <HierarchyToolbar
                    search={search}
                    onSearchChange={setSearch}
                    onExpandAll={expandAll}
                    onCollapseAll={collapseAll}
                />
            }
            disableContentPadding
        >
            {isLoading && <LoadingSpinner absolute fixed={false} />}
            <Stack direction="row" alignItems="center" gap={1} sx={styles.hint}>
                <DragIndicatorIcon sx={styles.hintIcon} />
                <Typography variant="caption">
                    {formatMessage(MESSAGES.teamHierarchyDragHint)}
                </Typography>
            </Stack>
            {deferredSearch && rows.length === 0 && (
                <Typography color="text.secondary" sx={styles.emptyMessage}>
                    {formatMessage(MESSAGES.noTeamHierarchyMatch)}
                </Typography>
            )}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                {rows.map(row =>
                    row.kind === 'team' ? (
                        <TeamRow
                            key={`team-${row.node.team.id}`}
                            row={row}
                            canDropOn={canDropOn}
                            onToggle={toggleTeam}
                            onAction={handleAction}
                        />
                    ) : (
                        <UserRow
                            key={`user-${row.team.id}-${row.user.id}`}
                            row={row}
                            onAction={handleAction}
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
            {tree && canHaveSubTeams(tree.team) && !deferredSearch && (
                <HierarchyRowLayout depth={1}>
                    <Button
                        size="small"
                        startIcon={<GroupAddOutlinedIcon />}
                        onClick={openRootCreateDialog}
                    >
                        {formatMessage(MESSAGES.addTeam)}
                    </Button>
                </HierarchyRowLayout>
            )}
            {dialog?.kind === 'create' && (
                <CreateEditTeam
                    isOpen
                    dialogType="create"
                    defaultValues={{
                        project: projectId,
                        parent: dialog.parent.id,
                    }}
                    closeDialog={closeDialog}
                    onSuccess={handleTeamCreated}
                />
            )}
            {dialog?.kind === 'rename' && (
                <RenameTeamDialog
                    team={dialog.team}
                    onConfirm={name =>
                        updateTeam({
                            teamId: dialog.team.id,
                            changes: { name },
                        })
                    }
                    closeDialog={closeDialog}
                />
            )}
            {dialog?.kind === 'move' && tree && (
                <MoveToDialog
                    item={dialog.item}
                    targets={getMoveTargets(tree, dialog.item)}
                    onConfirm={target => moveItem(dialog.item, target)}
                    closeDialog={closeDialog}
                />
            )}
            {dialog?.kind === 'delete' && (
                <DeleteTeamDialog
                    team={dialog.team}
                    onConfirm={() => deleteTeam(dialog.team.id)}
                    closeDialog={closeDialog}
                />
            )}
        </PlanningStepCard>
    );
};

export const TeamHierarchySection: FC = () => {
    const { formik } = usePlanningContext();
    const { formatMessage } = useSafeIntl();
    const { selectedTeam, project } = formik.values;

    if (!selectedTeam) {
        return (
            <PlanningStepCard
                step={2}
                title={formatMessage(MESSAGES.teamHierarchy)}
            >
                <Typography color="text.secondary">
                    {formatMessage(MESSAGES.selectRootTeamFirst)}
                </Typography>
            </PlanningStepCard>
        );
    }
    // Keyed so expansion and search reset when the root team changes.
    return (
        <TeamHierarchy
            key={selectedTeam}
            rootTeamId={selectedTeam}
            projectId={project}
        />
    );
};
