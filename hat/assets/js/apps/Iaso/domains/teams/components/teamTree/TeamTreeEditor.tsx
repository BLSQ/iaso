import React, { FC, useCallback, useState } from 'react';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import { Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Team, TeamTreeNode } from '../../types/team';
import { canHaveSubTeams, getToggledType } from '../../utils';
import { HierarchyRowLayout } from './HierarchyRowLayout';
import MESSAGES from './messages';
import { HierarchyDialogs } from './TeamActionDialogs';
import { EditableTeamTreeRows } from './TeamTreeRows';
import {
    DraggedItem,
    HierarchyAction,
    HierarchyDialog,
    HierarchyRow,
} from './types';
import {
    useDeleteHierarchyTeam,
    useMoveUser,
    useUpdateTeam,
} from './useTeamTreeMutations';

type Props = {
    rootTeamId: number;
    tree: TeamTreeNode;
    rows: HierarchyRow[];
    projectId?: number;
    showAddTeam: boolean;
    expandTeam: (teamId: number) => void;
    toggleTeam: (teamId: number) => void;
};

export const TeamTreeEditor: FC<Props> = ({
    rootTeamId,
    tree,
    rows,
    projectId,
    showAddTeam,
    expandTeam,
    toggleTeam,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: updateTeam } = useUpdateTeam(rootTeamId);
    const { mutate: moveUser } = useMoveUser(rootTeamId);
    const { mutate: deleteTeam } = useDeleteHierarchyTeam(rootTeamId);
    const [dialog, setDialog] = useState<HierarchyDialog>();

    const moveItem = useCallback(
        (item: DraggedItem, target: TeamTreeNode) => {
            if (item.kind === 'team') {
                updateTeam({ id: item.team.id, data: { parent: target.id } });
            } else {
                moveUser({ userId: item.user.id, from: item.team, to: target });
            }
            expandTeam(target.id);
        },
        [updateTeam, moveUser, expandTeam],
    );
    const renameTeam = useCallback(
        (team: TeamTreeNode, name: string) =>
            updateTeam({ id: team.id, data: { name } }),
        [updateTeam],
    );
    const openRootCreateDialog = useCallback(
        () => setDialog({ kind: 'create', parent: tree }),
        [tree],
    );
    const closeDialog = useCallback(() => setDialog(undefined), []);
    const handleTeamCreated = useCallback(
        (team: Team) => {
            if (team.parent) expandTeam(team.parent);
        },
        [expandTeam],
    );

    const handleAction = useCallback(
        (action: HierarchyAction) => {
            switch (action.kind) {
                case 'addSubTeam':
                    setDialog({ kind: 'create', parent: action.team });
                    break;
                case 'changeType':
                    updateTeam({
                        id: action.team.id,
                        data: { type: getToggledType(action.team) },
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
        [updateTeam, moveUser],
    );

    return (
        <>
            <EditableTeamTreeRows
                rows={rows}
                onMove={moveItem}
                onToggle={toggleTeam}
                onAction={handleAction}
            />
            {showAddTeam && canHaveSubTeams(tree) && (
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
            {dialog && (
                <HierarchyDialogs
                    dialog={dialog}
                    tree={tree}
                    projectId={projectId}
                    onMove={moveItem}
                    onRename={renameTeam}
                    onDelete={deleteTeam}
                    onTeamCreated={handleTeamCreated}
                    closeDialog={closeDialog}
                />
            )}
        </>
    );
};
