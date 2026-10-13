import React, { FC, useState } from 'react';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { noop } from 'lodash';
import { DeleteRestoreModal } from 'Iaso/components/DeleteRestoreModals/DeleteRestoreModal';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
import { DraggedItem, HierarchyTeam } from './types';
import { MoveTarget } from './utils';

const DIALOG_DEFAULTS = {
    open: true,
    onClose: noop,
    onCancel: noop,
    cancelMessage: MESSAGES.cancel,
};

type RenameProps = {
    team: HierarchyTeam;
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
            confirmMessage={MESSAGES.save}
        >
            <InputComponent
                type="text"
                keyValue="name"
                value={name}
                onChange={(_key, value) => setName(value)}
                label={MESSAGES.name}
                required
                withMarginTop={false}
            />
        </ConfirmCancelModal>
    );
};

type MoveProps = {
    item: DraggedItem;
    targets: MoveTarget[];
    onConfirm: (target: HierarchyTeam) => void;
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
            confirmMessage={MESSAGES.confirm}
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
    team: HierarchyTeam;
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
            {formatMessage(MESSAGES.deleteWarning, { name: team.name })}
        </DeleteRestoreModal>
    );
};
