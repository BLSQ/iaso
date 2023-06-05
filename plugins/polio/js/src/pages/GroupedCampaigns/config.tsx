import React, { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import {
    IconButton as IconButtonComponent,
    Column,
    IntlFormatMessage,
} from 'bluesquare-components';
import { DateTimeCellRfc } from '../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../../constants/messages';
import DeleteDialog from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import { GroupedCampaignDialog } from './GroupedCampaignDialog';

export const makeColumns = (
    formatMessage: IntlFormatMessage,
    // eslint-disable-next-line no-unused-vars
    deleteGroupedCampaign: (id: string) => void,
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
        sortable: false,
        Cell: settings => {
            return (
                <section>
                    {settings.row.original.campaigns.map(campaign => (
                        <Link
                            key={campaign.id}
                            href={`/dashboard/polio/list/campaignId/${campaign.id}`}
                        >
                            {`${campaign.obr_name}, `}
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
                <GroupedCampaignDialog
                    type="edit"
                    name={settings.row.original.name}
                    campaigns={settings.row.original.campaigns.map(
                        (campaign: { id: string; name: string }) => campaign.id,
                    )}
                    id={settings.row.original.id}
                    renderTrigger={({ openDialog }): ReactNode => {
                        return (
                            <IconButtonComponent
                                onClick={() => {
                                    openDialog();
                                }}
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                            />
                        );
                    }}
                />
                <DeleteDialog
                    keyName="grouped"
                    disabled={settings.row.original.instances_count > 0}
                    titleMessage={MESSAGES.deleteTitle}
                    message={MESSAGES.deleteText}
                    onConfirm={() => {
                        deleteGroupedCampaign(settings.row.original.id);
                    }}
                />
            </section>
        ),
    },
];
