import React, { FunctionComponent, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Button from '@mui/material/Button/Button';
import IconButton from '@mui/material/IconButton/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Menu from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { DeleteModal } from '../../../components/DeleteRestoreModals/DeleteModal';
import { DeleteRestoreModal } from '../../../components/DeleteRestoreModals/DeleteRestoreModal';
import { RestoreModal } from '../../../components/DeleteRestoreModals/RestoreModal';
import { baseUrls } from '../../../constants/urls';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import { useRestoreEntity, useSoftDeleteEntity } from '../hooks/requests';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';

type EntityProps = {
    entity: Pick<Entity, 'id' | 'deleted_at'>;
};

const useCanWriteEntities = (): boolean =>
    userHasPermission(Permission.ENTITIES_WRITE, useCurrentUser());

/**
 * Delete action on an active entity, restore action on a deleted one.
 */
export const EntityDeleteRestoreAction: FunctionComponent<EntityProps> = ({
    entity,
}) => {
    const canWrite = useCanWriteEntities();
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteEntity } = useSoftDeleteEntity();
    const { mutate: restoreEntity } = useRestoreEntity();

    if (!canWrite) {
        return null;
    }
    if (entity.deleted_at) {
        return (
            <RestoreModal
                type="icon"
                iconProps={{}}
                titleMessage={MESSAGES.restoreTitle}
                onConfirm={() => restoreEntity(entity.id)}
                id={`restore-entity-${entity.id}`}
                dataTestId="restore-entity-modal"
            >
                {formatMessage(MESSAGES.restoreText)}
            </RestoreModal>
        );
    }
    return (
        <DeleteModal
            type="icon"
            titleMessage={MESSAGES.deleteTitle}
            onConfirm={() => deleteEntity(entity.id)}
            id={`delete-entity-${entity.id}`}
            dataTestId="delete-entity-modal"
        >
            {formatMessage(MESSAGES.deleteEntityText)}
        </DeleteModal>
    );
};

type ActionsMenuProps = EntityProps & {
    // Called once the entity is deleted (e.g. to leave the details page)
    onDeleted?: () => void;
};

/**
 * Entity details: actions menu on the "Entity information" card
 */
export const EntityActionsMenu: FunctionComponent<ActionsMenuProps> = ({
    entity,
    onDeleted,
}) => {
    const canWrite = useCanWriteEntities();
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const { mutate: deleteEntity } = useSoftDeleteEntity(onDeleted);

    if (!canWrite || entity.deleted_at) {
        return null;
    }
    return (
        <>
            <IconButton
                size="small"
                aria-label={formatMessage(MESSAGES.moreActions)}
                onClick={event => setAnchorEl(event.currentTarget)}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        setIsDeleteOpen(true);
                    }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        {formatMessage(MESSAGES.delete)}
                    </ListItemText>
                </MenuItem>
            </Menu>
            <DeleteRestoreModal
                isOpen={isDeleteOpen}
                closeDialog={() => setIsDeleteOpen(false)}
                titleMessage={MESSAGES.deleteTitle}
                onConfirm={() => deleteEntity(entity.id)}
                id={`delete-entity-${entity.id}`}
                dataTestId="delete-entity-modal"
            >
                {formatMessage(MESSAGES.deleteEntityText)}
            </DeleteRestoreModal>
        </>
    );
};

/**
 * Entity details: "Restore" button for the banner of a deleted entity.
 */
export const EntityRestoreButton: FunctionComponent<EntityProps> = ({
    entity,
}) => {
    const canWrite = useCanWriteEntities();
    const { formatMessage } = useSafeIntl();
    const [isOpen, setIsOpen] = useState(false);
    const { mutate: restoreEntity } = useRestoreEntity();

    if (!canWrite || !entity.deleted_at) {
        return null;
    }
    return (
        <>
            <Button
                color="inherit"
                size="small"
                onClick={() => setIsOpen(true)}
            >
                {formatMessage(MESSAGES.restore)}
            </Button>
            <DeleteRestoreModal
                isOpen={isOpen}
                closeDialog={() => setIsOpen(false)}
                titleMessage={MESSAGES.restoreTitle}
                onConfirm={() => restoreEntity(entity.id)}
                id={`restore-entity-${entity.id}`}
                dataTestId="restore-entity-modal"
            >
                {formatMessage(MESSAGES.restoreText)}
            </DeleteRestoreModal>
        </>
    );
};

type Props = {
    entity: Entity;
};

/** Actions cell of the entity list */
export const EntityActions: FunctionComponent<Props> = ({ entity }) => {
    return (
        <>
            <IconButtonComponent
                url={`/${baseUrls.entityDetails}/entityId/${entity.id}`}
                icon="remove-red-eye"
                tooltipMessage={MESSAGES.see}
            />
            {entity.has_duplicates && !entity.deleted_at && (
                <IconButtonComponent
                    url={`/${baseUrls.entityDuplicates}/entity_id/${entity.id}/order/id/pageSize/50/page/1/`}
                    overrideIcon={FileCopyIcon}
                    tooltipMessage={MESSAGES.seeDuplicate}
                />
            )}
            <EntityDeleteRestoreAction entity={entity} />
        </>
    );
};
