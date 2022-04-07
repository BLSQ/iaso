import React, { ReactElement } from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { Link } from 'react-router';
import { DateTimeCellRfc } from '../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { Column } from '../../../../../../hat/assets/js/apps/Iaso/types/table';
import MESSAGES from '../../constants/messages';
import DeleteDialog from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import { IntlFormatMessage } from '../../constants/types';

export const makeColumns = (
    formatMessage: IntlFormatMessage,
): Array<Column> => [
    {
        Header: formatMessage(MESSAGES.name),
        id: 'name',
        accessor: 'name',
    },
    {
        Header: formatMessage(MESSAGES.created_at),
        accessor: 'created_at',
        Cell: DateTimeCellRfc,
    },
    {
        Header: formatMessage(MESSAGES.updated_at),
        accessor: 'updated_at',
        Cell: DateTimeCellRfc,
    },
    {
        Header: formatMessage(MESSAGES.campaigns),
        accessor: 'campaigns',
        Cell: settings => {
            return (
                <section>
                    {settings.row.original.campaigns.map(campaign => (
                        <Link
                            key={campaign.id}
                            href={`/dashboard/polio/list/campaignId/${campaign.id}`}
                        >
                            {`${campaign.name}, `}
                        </Link>
                    ))}
                </section>
            );
        },
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
                    onClick={() => {
                        console.log('editing', settings.row.original);
                    }}
                    icon="edit"
                    tooltipMessage={MESSAGES.edit}
                />

                <DeleteDialog
                    keyName="grouped"
                    disabled={settings.row.original.instances_count > 0}
                    titleMessage={MESSAGES.deleteTitle}
                    message={MESSAGES.deleteText}
                    onConfirm={() => {
                        console.log('deleting', settings.row.original);
                    }}
                />
            </section>
        ),
    },
];
