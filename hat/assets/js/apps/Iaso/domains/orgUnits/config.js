import React from 'react';

import Color from 'color';
import {
    IconButton as IconButtonComponent,
    Expander,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from '../../constants/urls';
import OrgUnitTooltip from './components/OrgUnitTooltip';
import getDisplayName from '../../utils/usersUtils.ts';
import MESSAGES from './messages';
import { useGetStatusMessage, getOrgUnitGroups } from './utils';
import {
    DateTimeCell,
    DateTimeCellRfc,
} from '../../components/Cells/DateTimeCell';

export const useOrgUnitsTableColumns = searches => {
    const { formatMessage } = useSafeIntl();
    const getStatusMessage = useGetStatusMessage();
    const columns = [
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
                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/infos`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.details}
                    />
                    {(settings.row.original.has_geo_json ||
                        Boolean(
                            settings.row.original.latitude &&
                                settings.row.original.longitude,
                        )) && (
                        <IconButtonComponent
                            url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/map`}
                            icon="map"
                            tooltipMessage={MESSAGES.map}
                        />
                    )}

                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.id}/tab/history`}
                        icon="history"
                        tooltipMessage={MESSAGES.history}
                    />
                </section>
            ),
        },
    ];
    const searchCount = searches && searches.length;
    if (searchCount > 1) {
        columns.unshift({
            Header: formatMessage(MESSAGES.search),
            accessor: 'search_index',
            width: 100,
            Cell: settings => (
                <section>
                    <span
                        style={
                            settings.row.original.color
                                ? {
                                      backgroundColor: `#${settings.row.original.color}`,
                                      border: `2px solid ${Color(
                                          `#${settings.row.original.color}`,
                                      ).darken(0.5)}`,
                                  }
                                : {}
                        }
                        className={classes.roundColor}
                    />
                </section>
            ),
        });
    }
    return columns;
};

export const orgUnitsLogsColumns = formatMessage => [
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
            settings.row.original.user
                ? getDisplayName(settings.row.original.user)
                : null,
    },
    {
        expander: true,
        accessor: 'expander',
        width: 65,
        Expander,
    },
];

export const staleTime = 60000;
