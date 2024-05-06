import { Tooltip } from '@mui/material';
import { Column, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import React, { useMemo } from 'react';
import { DeleteModal } from '../../../../../../../hat/assets/js/apps/Iaso/components/DeleteRestoreModals/DeleteModal';
import { RestoreModal } from '../../../../../../../hat/assets/js/apps/Iaso/components/DeleteRestoreModals/RestoreModal';
import MESSAGES from '../../../constants/messages';
import { CampaignListItem } from '../../../constants/types';
import { EditCampaignModal } from '../MainDialog/EditCampaignModal';

type Args = {
    showOnlyDeleted: boolean;
    // eslint-disable-next-line no-unused-vars
    handleClickRestoreRow: (value: number) => void;
    // eslint-disable-next-line no-unused-vars
    handleClickDeleteRow: (value: number) => void;
    params: any;
};

export const useCampaignsTableColumns = ({
    showOnlyDeleted,
    handleClickRestoreRow,
    handleClickDeleteRow,
    params,
}: Args): Column[] => {
    const { formatMessage } = useSafeIntl();
    // type Column need to be updated so accessor can also be FunctionComponent
    // @ts-ignore
    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.country),
                id: 'country__name',
                accessor: 'top_level_org_unit_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.campaignIdentifier),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.virusNotificationDate),
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: formatMessage(MESSAGES.lastRound),
                id: `last_round_started_at`,
                Cell: settings => {
                    const allRounds = (
                        <>
                            {settings.row.original.rounds.map(r => (
                                <li key={`${r.number}-${r.started_at}`}>
                                    {`${r.number}. ${r.started_at} -> ${r.ended_at}`}
                                    <br />
                                </li>
                            ))}
                        </>
                    );
                    return (
                        <Tooltip title={allRounds}>
                            <span>
                                {settings.row.original.rounds &&
                                    settings.row.original.rounds[
                                        settings.row.original.rounds.length - 1
                                    ]?.started_at}
                            </span>
                        </Tooltip>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.campaign_types),
                accessor: 'campaign_types',
                sortable: false,
                Cell: ({
                    value,
                }: {
                    value: CampaignListItem['campaign_types'];
                }): string =>
                    value.map(campaignType => campaignType.name).join(', '),
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'general_status',
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => (
                    <>
                        {!showOnlyDeleted && (
                            <>
                                <EditCampaignModal
                                    params={params}
                                    campaignId={settings.value}
                                />
                                <DeleteModal
                                    type="icon"
                                    onConfirm={() =>
                                        handleClickDeleteRow(settings.value)
                                    }
                                    titleMessage={MESSAGES.deleteWarning}
                                    iconProps={{}}
                                />
                            </>
                        )}
                        {showOnlyDeleted && (
                            <RestoreModal
                                type="icon"
                                titleMessage={MESSAGES.restoreWarning}
                                iconProps={{}}
                                onConfirm={() =>
                                    handleClickRestoreRow(settings.value)
                                }
                            />
                        )}
                    </>
                ),
            },
        ];
        if (showOnlyDeleted) {
            cols.unshift({
                Header: formatMessage(MESSAGES.deleted_at),
                accessor: 'deleted_at',
                sortable: false,
                Cell: settings => (
                    <span>
                        {moment(settings.row.original.deleted_at).format('LTS')}
                    </span>
                ),
            });
        }
        return cols;
    }, [
        formatMessage,
        showOnlyDeleted,
        params,
        handleClickDeleteRow,
        handleClickRestoreRow,
    ]);
};
