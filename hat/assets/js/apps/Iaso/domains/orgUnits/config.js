import React from 'react';
import moment from 'moment';
import { Tooltip } from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import Color from 'color';
import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import { baseUrls } from '../../constants/urls';
import OrgUnitTooltip from './components/OrgUnitTooltip';
import getDisplayName from '../../utils/usersUtils';
import MESSAGES from './messages';
import { getStatusMessage, getOrgUnitGroups } from './utils';

export const orgUnitsTableColumns = (formatMessage, classes, searches) => {
    const getStatusColor = status => {
        switch (status) {
            case 'NEW': {
                // value taken from /iaso/hat/assets/css/_iaso.scss
                return classes.statusNew;
            }
            case 'REJECTED': {
                return classes.statusRejected;
            }
            default:
                return classes.statusValidated;
        }
    };
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
                <OrgUnitTooltip orgUnit={settings.original}>
                    <span>{settings.original.name}</span>
                </OrgUnitTooltip>
            ),
        },
        {
            Header: formatMessage(MESSAGES.type),
            accessor: 'org_unit_type_id',
            Cell: settings => (
                <section>{settings.original.org_unit_type_name}</section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.groups),
            accessor: 'groups',
            Cell: settings => (
                <section>{getOrgUnitGroups(settings.original)}</section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.source),
            accessor: 'source',
            sortable: false,
            Cell: settings => (
                <section>
                    {settings.original.source && settings.original.source}
                    {!settings.original.source && textPlaceholder}
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'validation_status',
            Cell: settings => {
                const status = settings.original.validation_status;
                return (
                    <span className={getStatusColor(status)}>
                        {getStatusMessage(status, formatMessage)}
                    </span>
                );
            },
        },
        {
            Header: formatMessage(MESSAGES.instances_count),
            accessor: 'instances_count',
            Cell: settings => <span>{settings.original.instances_count}</span>,
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.updated_at).format('LTS')}
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.created_at).format('LTS')}
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.action),
            resizable: false,
            sortable: false,
            width: 150,
            Cell: settings => (
                <section>
                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}/tab/infos`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.details}
                    />
                    {(settings.original.has_geo_json ||
                        Boolean(
                            settings.original.latitude &&
                                settings.original.longitude,
                        )) && (
                        <IconButtonComponent
                            url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}/tab/map`}
                            icon="map"
                            tooltipMessage={MESSAGES.map}
                        />
                    )}

                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}/tab/history`}
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
                            settings.original.color
                                ? {
                                      backgroundColor: `#${settings.original.color}`,
                                      border: `2px solid ${Color(
                                          `#${settings.original.color}`,
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

export const orgUnitsLogsColumns = (formatMessage, classes) => [
    {
        Header: 'ID',
        accessor: 'id',
        width: 100,
    },
    {
        Header: formatMessage(MESSAGES.date),
        accessor: 'created_at',
        Cell: settings => (
            <span>{moment(settings.original.created_at).format('LTS')}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.user),
        accessor: 'user__username',
        Cell: settings => <span>{getDisplayName(settings.original.user)}</span>,
    },
    {
        expander: true,
        width: 65,
        // eslint-disable-next-line react/prop-types
        Expander: ({ isExpanded }) =>
            isExpanded ? (
                <VisibilityOff />
            ) : (
                <Tooltip
                    classes={{
                        popper: classes.popperFixed,
                    }}
                    title={formatMessage(MESSAGES.details)}
                >
                    <Visibility />
                </Tooltip>
            ),
    },
];
