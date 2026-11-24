import React, { FunctionComponent } from 'react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { DeleteModal } from '../../../components/DeleteRestoreModals/DeleteModal';
import { RestoreModal } from '../../../components/DeleteRestoreModals/RestoreModal';
import { baseUrls } from '../../../constants/urls';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import { useRestoreEntity, useSoftDeleteEntity } from '../hooks/requests';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';

type DeleteRestoreProps = {
    entity: Pick<Entity, 'id' | 'deleted_at'>;
    type: 'icon' | 'button';
    onDeleted?: () => void;
};

/**
 * Delete action on an active entity, restore action on a deleted one.
 */
export const EntityDeleteRestoreAction: FunctionComponent<
    DeleteRestoreProps
> = ({ entity, type, onDeleted }) => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteEntity } = useSoftDeleteEntity(onDeleted);
    const { mutate: restoreEntity } = useRestoreEntity();

    if (!userHasPermission(Permission.ENTITIES_WRITE, currentUser)) {
        return null;
    }
    if (entity.deleted_at) {
        return (
            <RestoreModal
                type={type}
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
            type={type}
            titleMessage={MESSAGES.deleteTitle}
            onConfirm={() => deleteEntity(entity.id)}
            id={`delete-entity-${entity.id}`}
            dataTestId="delete-entity-modal"
        >
            {formatMessage(MESSAGES.deleteEntityText)}
        </DeleteModal>
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
            <EntityDeleteRestoreAction entity={entity} type="icon" />
        </>
    );
};
