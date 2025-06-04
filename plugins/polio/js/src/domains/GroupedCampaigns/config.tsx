import {
    Column,
    IconButton,
    LinkWithLocation,
    useSafeIntl,
} from 'bluesquare-components';
import React, { ReactElement, ReactNode, useMemo } from 'react';
import { DateTimeCellRfc } from '../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import DeleteDialog from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import MESSAGES from '../../constants/messages';
import { baseUrls } from '../../constants/urls';
import { GroupedCampaignDialog } from './GroupedCampaignDialog';

export const useGroupedCampaignsColumns = (
    deleteGroupedCampaign: (id: string) => void,
): Array<Column> => {
    const { formatMessage } = useSafeIntl();
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
                                <LinkWithLocation
                                    key={campaign.id}
                                    to={`/${baseUrls.campaigns}/campaignId/${campaign.id}`}
                                >
                                    {`${campaign.obr_name}, `}
                                </LinkWithLocation>
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
                                (campaign: { id: string; name: string }) =>
                                    campaign.id,
                            )}
                            id={settings.row.original.id}
                            renderTrigger={({ openDialog }): ReactNode => {
                                return (
                                    <IconButton
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
        ],
        [deleteGroupedCampaign, formatMessage],
    );
};
