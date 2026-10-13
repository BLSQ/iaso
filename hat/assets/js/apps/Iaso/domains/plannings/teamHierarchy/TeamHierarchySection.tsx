import React, {
    ComponentProps,
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
import { canHaveSubTeams } from 'Iaso/domains/teams/utils';
import { SxStyles } from 'Iaso/types/general';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import { PlanningStepCard } from '../components/PlanningStepCard';
import { usePlanningContext } from '../contexts/PlanningContext';
import MESSAGES from '../messages';
import { HierarchyRowLayout } from './HierarchyRowLayout';
import { HierarchyToolbar } from './HierarchyToolbar';
import { TeamRow } from './TeamRow';
import { DraggedItem, HierarchyTeam, UserRowData } from './types';
import { UserRow } from './UserRow';
import {
    useGetTeamHierarchy,
    useMoveTeam,
    useMoveUser,
    useRefreshTeamHierarchy,
} from './useTeamHierarchy';
import {
    buildTeamTree,
    canDrop,
    collectTeamIds,
    countTeamsAndUsers,
    flattenTeamTree,
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

type TeamDialogProps = Pick<
    ComponentProps<typeof CreateEditTeam>,
    'dialogType' | 'id' | 'defaultValues'
>;

type Props = {
    rootTeamId: number;
    projectId?: number;
};

const TeamHierarchy: FC<Props> = ({ rootTeamId, projectId }) => {
    const { formatMessage } = useSafeIntl();
    const { data: teams = [], isLoading } = useGetTeamHierarchy(rootTeamId);
    const refreshHierarchy = useRefreshTeamHierarchy(rootTeamId);
    const { mutate: moveTeam } = useMoveTeam(rootTeamId);
    const { mutate: moveUser } = useMoveUser(rootTeamId);

    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [expandedTeamIds, setExpandedTeamIds] = useState(
        () => new Set([rootTeamId]),
    );
    const [draggedItem, setDraggedItem] = useState<DraggedItem>();
    const [teamDialog, setTeamDialog] = useState<TeamDialogProps>();

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
    const canDropOn = useCallback(
        (target: HierarchyTeam) =>
            Boolean(tree && draggedItem && canDrop(tree, draggedItem, target)),
        [tree, draggedItem],
    );
    const handleDragStart = useCallback(
        ({ active }: DragStartEvent) =>
            setDraggedItem(active.data.current as DraggedItem),
        [],
    );
    const handleDragCancel = useCallback(() => setDraggedItem(undefined), []);
    const handleDragEnd = useCallback(
        ({ over }: DragEndEvent) => {
            setDraggedItem(undefined);
            const target: HierarchyTeam | undefined = over?.data.current?.team;
            if (!draggedItem || !target || !canDropOn(target)) return;
            if (draggedItem.kind === 'team') {
                moveTeam({ teamId: draggedItem.team.id, parentId: target.id });
            } else {
                moveUser({
                    userId: draggedItem.user.id,
                    from: draggedItem.team,
                    to: target,
                });
            }
            expandTeam(target.id);
        },
        [draggedItem, canDropOn, moveTeam, moveUser, expandTeam],
    );

    const openCreateDialog = useCallback(
        (parent: HierarchyTeam) =>
            setTeamDialog({
                dialogType: 'create',
                defaultValues: { project: projectId, parent: parent.id },
            }),
        [projectId],
    );
    const openEditDialog = useCallback(
        (team: HierarchyTeam) =>
            setTeamDialog({ dialogType: 'edit', id: team.id }),
        [],
    );
    const closeTeamDialog = useCallback(() => setTeamDialog(undefined), []);
    const handleTeamSaved = useCallback(
        (team: Team) => {
            refreshHierarchy();
            if (team.parent) expandTeam(team.parent);
        },
        [refreshHierarchy, expandTeam],
    );
    const openRootCreateDialog = useCallback(() => {
        if (tree) openCreateDialog(tree.team);
    }, [tree, openCreateDialog]);

    const removeFromHierarchy = useCallback(
        (team: HierarchyTeam) => moveTeam({ teamId: team.id, parentId: null }),
        [moveTeam],
    );
    const removeFromTeam = useCallback(
        ({ user, team }: UserRowData) =>
            moveUser({ userId: user.id, from: team }),
        [moveUser],
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
                            onAddSubTeam={openCreateDialog}
                            onEdit={openEditDialog}
                            onRemoveFromHierarchy={removeFromHierarchy}
                        />
                    ) : (
                        <UserRow
                            key={`user-${row.team.id}-${row.user.id}`}
                            row={row}
                            onRemoveFromTeam={removeFromTeam}
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
            {teamDialog && (
                <CreateEditTeam
                    isOpen
                    {...teamDialog}
                    closeDialog={closeTeamDialog}
                    onSuccess={handleTeamSaved}
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
