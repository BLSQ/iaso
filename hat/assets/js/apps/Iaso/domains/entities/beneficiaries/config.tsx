import React, { ReactElement } from 'react';
// @ts-ignore
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { IntlMessage } from '../../../types/intl';
import MESSAGES from '../messages';

import { baseUrls } from '../../../constants/urls';

import { Entity } from '../types/entity';
import { Column } from '../../../types/table';

export const baseUrl = baseUrls.beneficiaries;

type Props = {
    // eslint-disable-next-line no-unused-vars
    formatMessage: (msg: IntlMessage) => string;
    // eslint-disable-next-line no-unused-vars
    deleteEntity: (e: Entity) => void;
    // eslint-disable-next-line no-unused-vars
    // saveEntity: (e: Entity) => void;
};

export const columns = ({
    formatMessage,
    deleteEntity,
}: Props): Array<Column> => [
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
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: (settings): ReactElement => (
            // TODO: limit to user permissions
            <section>
                <IconButtonComponent
                    url={`/${baseUrls.beneficiariesDetails}/beneficiaryId/${settings.row.original.id}`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.edit}
                />
                <DeleteDialog
                    keyName="entity"
                    disabled={settings.row.original.instances_count > 0}
                    titleMessage={MESSAGES.deleteTitle}
                    message={MESSAGES.deleteText}
                    onConfirm={() => deleteEntity(settings.row.original)}
                />
            </section>
        ),
    },
];
