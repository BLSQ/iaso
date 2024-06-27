import React, { useMemo } from 'react';
import {
    IconButton,
    Expander,
    useSafeIntl,
    textPlaceholder,
    Column,
} from 'bluesquare-components';
import { baseUrls } from '../../constants/urls';
import OrgUnitTooltip from './components/OrgUnitTooltip';
import getDisplayName from '../../utils/usersUtils';
import MESSAGES from './messages';
import { useGetStatusMessage, getOrgUnitGroups } from './utils';
import {
    DateTimeCell,
    DateTimeCellRfc,
} from '../../components/Cells/DateTimeCell';

export const useOrgUnitsTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const getStatusMessage = useGetStatusMessage();
    return useMemo(
        () => [
            {
                Header: 'Id',
                accessor: 'id',
                width: 80,
            },
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                Cell: settings => (
                    <OrgUnitTooltip orgUnit={settings.row.original}>
                        <span>{settings.row.original.name}</span>
                    </OrgUnitTooltip>
                ),
            },
            {
                Header: formatMessage(MESSAGES.type),
                accessor: 'org_unit_type_name',
                id: 'org_unit_type__name',
            },
            {
                Header: formatMessage(MESSAGES.groups),
                accessor: 'groups',
                sortable: false,
                width: 400,
                Cell: settings => getOrgUnitGroups(settings.row.original),
            },
            {
                Header: formatMessage(MESSAGES.source),
                accessor: 'source',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'validation_status',
                Cell: settings => getStatusMessage(settings.value),
            },
            {
                Header: formatMessage(MESSAGES.instances_count),
                accessor: 'instances_count',
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.action),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                width: 250,
                Cell: settings => (
                    <section>
                        <IconButton
                            url={`/${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/infos`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.details}
                        />
                        {(settings.row.original.has_geo_json ||
                            Boolean(
                                settings.row.original.latitude &&
                                    settings.row.original.longitude,
                            )) && (
                            <IconButton
                                url={`/${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/map`}
                                icon="map"
                                tooltipMessage={MESSAGES.map}
                            />
                        )}

                        <IconButton
                            url={`/${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/history`}
                            icon="history"
                            tooltipMessage={MESSAGES.history}
                        />
                    </section>
                ),
            },
        ],
        [formatMessage, getStatusMessage],
    );
};

export const useOrgUnitsLogsColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: 'ID',
                accessor: 'id',
                width: 100,
            },
            {
                Header: formatMessage(MESSAGES.date),
                accessor: 'created_at',
                Cell: DateTimeCellRfc,
            },
            {
                Header: formatMessage(MESSAGES.user),
                accessor: 'user__username',
                Cell: settings =>
                    // Problem with TS typing of `settings`
                    // @ts-ignore
                    settings.row.original.user
                        ? // @ts-ignore
                          getDisplayName(settings.row.original.user)
                        : textPlaceholder,
            },
            {
                Header: '', // This is to please the tS compiler
                expander: true,
                accessor: 'expander',
                width: 65,
                Expander,
            },
        ],
        [formatMessage],
    );
};

export const staleTime = 60000;
