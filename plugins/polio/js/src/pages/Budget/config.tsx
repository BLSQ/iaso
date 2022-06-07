/* eslint-disable camelcase */
import React, { useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { Column } from '../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BUDGET_DETAILS } from '../../constants/routes';
import { DateTimeCellRfc } from '../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { BudgetFilesModal } from './BudgetFilesModal';

const baseUrl = BUDGET_DETAILS;

export const useBudgetColumns = (showOnlyDeleted = false): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.obrName),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.country),
                id: 'country__name',
                accessor: 'top_level_org_unit_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.virusNotificationDate),
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: formatMessage(MESSAGES.status),
                sortable: false,
                accessor: 'general_status',
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            {!showOnlyDeleted && (
                                <>
                                    <IconButtonComponent
                                        icon="remove-red-eye"
                                        tooltipMessage={MESSAGES.details}
                                        url={`${baseUrl}/campaignId/${settings.row.original.id}/campaignName/${settings.row.original.obr_name}`}
                                    />
                                    {/* TODO uncomment when deletion is implemented */}
                                    {/* <IconButtonComponent
                                    icon="delete"
                                    tooltipMessage={MESSAGES.delete}
                                    onClick={() =>
                                        handleClickDeleteRow(settings.value)
                                    }
                                /> */}
                                </>
                            )}
                            {/* TODO uncomment when deletion is implemented */}
                            {/* {showOnlyDeleted && (
                            <IconButtonComponent
                                icon="restore-from-trash"
                                tooltipMessage={MESSAGES.restoreCampaign}
                                onClick={() =>
                                    handleClickRestoreRow(settings.value)
                                }
                            />
                        )} */}
                        </>
                    );
                },
            },
        ];
        // if (showOnlyDeleted) {
        //     cols.unshift({
        //         Header: formatMessage(MESSAGES.deleted_at),
        //         accessor: 'deleted_at',
        //         Cell: settings =>
        //             moment(settings.row.original.deleted_at).format('LTS'),
        //     });
        // }
        return cols;
    }, [formatMessage, showOnlyDeleted]);
};

export const useBudgetDetailsColumns = ({ teams, profiles }): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                sortable: true,
                Cell: DateTimeCellRfc,
            },
            {
                Header: formatMessage(MESSAGES.event),
                id: 'type',
                accessor: 'type',
                sortable: true,
                Cell: settings => {
                    return formatMessage(MESSAGES[settings.row.original.type]);
                },
            },
            {
                Header: formatMessage(MESSAGES.author),
                id: 'author',
                accessor: 'author',
                sortable: true,
                Cell: settings => {
                    const { author } = settings.row.original;
                    const authorProfile = profiles?.profiles?.find(
                        profile => profile.user_id === author,
                    );
                    if (!authorProfile?.first_name && !authorProfile?.last_name)
                        return authorProfile?.user_name ?? author;
                    return `${authorProfile.first_name} ${authorProfile.last_name}`;
                },
            },
            {
                Header: formatMessage(MESSAGES.destination),
                id: 'target_teams',
                accessor: 'target_teams',
                sortable: true,
                Cell: settings => {
                    const { target_teams } = settings.row.original;
                    if (target_teams?.length === 0) return target_teams;
                    return target_teams.map(
                        (target_team: number) =>
                            teams?.find(team => team.id === target_team)?.name,
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.viewFiles),
                id: 'id',
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <BudgetFilesModal
                            eventId={settings.row.original.id}
                            note={settings.row.original.comment}
                        />
                    );
                },
            },
        ];
    }, [formatMessage, teams, profiles]);
};
