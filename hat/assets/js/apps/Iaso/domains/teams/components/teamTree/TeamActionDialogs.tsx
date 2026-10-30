import React, { FC, useState } from 'react';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { noop } from 'lodash';
import { DeleteRestoreModal } from 'Iaso/components/DeleteRestoreModals/DeleteRestoreModal';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { CreateEditTeam } from 'Iaso/domains/teams/components/CreateEditTeam';
import TEAM_MESSAGES from 'Iaso/domains/teams/messages';
import { Team, TeamTreeNode } from 'Iaso/domains/teams/types/team';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import MESSAGES from './messages';
import { DraggedItem, HierarchyDialog } from './types';
import { MoveTarget, getMoveTargets } from './utils';

const DIALOG_DEFAULTS = {
    open: true,
    onClose: noop,
    onCancel: noop,
    cancelMessage: TEAM_MESSAGES.cancel,
};

type RenameProps = {
    team: TeamTreeNode;
    onConfirm: (name: string) => void;
    closeDialog: () => void;
};

export const RenameTeamDialog: FC<RenameProps> = ({
    team,
    onConfirm,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const [name, setName] = useState(team.name);
    const trimmedName = name.trim();
    return (
        <ConfirmCancelModal
            {...DIALOG_DEFAULTS}
            id="rename-team-dialog"
            dataTestId="rename-team-dialog"
            closeDialog={closeDialog}
            onConfirm={() => onConfirm(trimmedName)}
            allowConfirm={Boolean(trimmedName) && trimmedName !== team.name}
            titleMessage={formatMessage(MESSAGES.renameTeam)}
            confirmMessage={TEAM_MESSAGES.save}
        >
            <InputComponent
                type="text"
                keyValue="name"
                value={name}
                onChange={(_key, value) => setName(value)}
                label={TEAM_MESSAGES.name}
                required
                withMarginTop={false}
            />
        </ConfirmCancelModal>
    );
};

type MoveProps = {
    item: DraggedItem;
    targets: MoveTarget[];
    onConfirm: (target: TeamTreeNode) => void;
    closeDialog: () => void;
};

export const MoveToDialog: FC<MoveProps> = ({
    item,
    targets,
    onConfirm,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const [targetId, setTargetId] = useState<number>();
    const target = targets.find(({ team }) => team.id === targetId)?.team;
    const itemName =
        item.kind === 'team' ? item.team.name : getDisplayName(item.user);
    return (
        <ConfirmCancelModal
            {...DIALOG_DEFAULTS}
            id="move-to-dialog"
            dataTestId="move-to-dialog"
            closeDialog={closeDialog}
            onConfirm={() => target && onConfirm(target)}
            allowConfirm={Boolean(target)}
            titleMessage={formatMessage(MESSAGES.moveItemTo, {
                name: itemName,
            })}
            confirmMessage={TEAM_MESSAGES.confirm}
        >
            <InputComponent
                type="select"
                keyValue="target"
                value={targetId}
                onChange={(_key, value) => setTargetId(value)}
                label={MESSAGES.destinationTeam}
                options={targets.map(({ team, path }) => ({
                    value: team.id,
                    label: path,
                }))}
                required
                withMarginTop={false}
            />
        </ConfirmCancelModal>
    );
};

type DeleteProps = {
    team: TeamTreeNode;
    onConfirm: () => void;
    closeDialog: () => void;
};

export const DeleteTeamDialog: FC<DeleteProps> = ({
    team,
    onConfirm,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <DeleteRestoreModal
            isOpen
            id="delete-team-dialog"
            dataTestId="delete-team-dialog"
            closeDialog={closeDialog}
            onConfirm={onConfirm}
            titleMessage={formatMessage(MESSAGES.deleteTeam)}
        >
            {formatMessage(TEAM_MESSAGES.deleteWarning, { name: team.name })}
        </DeleteRestoreModal>
    );
};

type HierarchyDialogsProps = {
    dialog: HierarchyDialog;
    tree: TeamTreeNode;
    projectId?: number;
    onMove: (item: DraggedItem, target: TeamTreeNode) => void;
    onRename: (team: TeamTreeNode, name: string) => void;
    onDelete: (variables: { id: number }) => void;
    onTeamCreated: (team: Team) => void;
    closeDialog: () => void;
};

export const HierarchyDialogs: FC<HierarchyDialogsProps> = ({
    dialog,
    tree,
    projectId,
    onMove,
    onRename,
    onDelete,
    onTeamCreated,
    closeDialog,
}) => {
    switch (dialog.kind) {
        case 'create':
            return (
                <CreateEditTeam
                    isOpen
                    dialogType="create"
                    defaultValues={{
                        project: projectId,
                        parent: dialog.parent.id,
                    }}
                    closeDialog={closeDialog}
                    onSuccess={onTeamCreated}
                />
            );
        case 'rename':
            return (
                <RenameTeamDialog
                    team={dialog.team}
                    onConfirm={name => onRename(dialog.team, name)}
                    closeDialog={closeDialog}
                />
            );
        case 'move':
            return (
                <MoveToDialog
                    item={dialog.item}
                    targets={getMoveTargets(tree, dialog.item)}
                    onConfirm={target => onMove(dialog.item, target)}
                    closeDialog={closeDialog}
                />
            );
        case 'delete':
            return (
                <DeleteTeamDialog
                    team={dialog.team}
                    onConfirm={() => onDelete({ id: dialog.team.id })}
                    closeDialog={closeDialog}
                />
            );
    }
};
