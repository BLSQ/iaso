import DataSourceIcon from '@mui/icons-material/ListAltTwoTone';
import {
    Column,
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import React, { ReactElement, useMemo } from 'react';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import Workflow from '../../../components/svg/Workflow';
import { EntityTypesDialog } from './components/EntityTypesDialog';

import MESSAGES from './messages';

import { baseUrls } from '../../../constants/urls';

import { userHasPermission } from '../../users/utils';
import { EntityType } from './types/entityType';

import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';

export const baseUrl = baseUrls.entityTypes;

type Props = {
    deleteEntityType: (e: EntityType) => void;
    saveEntityType: (e: EntityType) => void;
};

export const useColumns = ({
    deleteEntityType,
    saveEntityType,
}: Props): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.entitiesCount),
                accessor: 'entities_count',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                width: 200,
                Cell: (settings): ReactElement => {
                    const type = settings.row.original as EntityType;
                    return (
                        <section>
                            {userHasPermission(
                                Permission.ENTITY_TYPE_WRITE,
                                currentUser,
                            ) && (
                                <EntityTypesDialog
                                    renderTrigger={({ openDialog }) => (
                                        <IconButtonComponent
                                            id={`edit-button-${type.id}`}
                                            onClick={openDialog}
                                            icon="edit"
                                            dataTestId="edit-button"
                                            tooltipMessage={MESSAGES.edit}
                                        />
                                    )}
                                    initialData={type}
                                    titleMessage={MESSAGES.updateMessage}
                                    saveEntityType={saveEntityType}
                                />
                            )}
                            <IconButtonComponent
                                id={`entities-link-${type.id}`}
                                url={`/${baseUrls.entities}/entityTypeIds/${type.id}/locationLimit/1000/order/-last_saved_instance/pageSize/20/page/1`}
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.entities}
                                disabled={type.entities_count === 0}
                            />
                            {settings.row.original?.reference_form && (
                                <IconButtonComponent
                                    id={`form-link-${settings.row.original.id}`}
                                    url={`/${baseUrls.formDetail}/formId/${settings.row.original.reference_form}`}
                                    overrideIcon={DataSourceIcon}
                                    tooltipMessage={MESSAGES.viewForm}
                                />
                            )}
                            {userHasPermission(
                                Permission.ENTITY_TYPE_WRITE,
                                currentUser,
                            ) &&
                                type.entities_count === 0 && (
                                    <DeleteDialog
                                        keyName={`entityType-${type.id}`}
                                        disabled={type.instances_count > 0}
                                        titleMessage={MESSAGES.deleteTitle}
                                        message={MESSAGES.deleteText}
                                        onConfirm={() => deleteEntityType(type)}
                                    />
                                )}
                            <IconButtonComponent
                                id={`workflow-link-${type.id}`}
                                url={`/${baseUrls.workflows}/entityTypeId/${type.id}`}
                                tooltipMessage={MESSAGES.workflow}
                                overrideIcon={Workflow}
                            />
                        </section>
                    );
                },
            },
        ],
        [currentUser, deleteEntityType, formatMessage, saveEntityType],
    );
};
