import React from 'react';
import moment from 'moment';
import { Tooltip } from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import Color from 'color';
import { baseUrls } from '../../constants/urls';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import { textPlaceholder } from '../../constants/uiConstants';
import MESSAGES from './messages';

export const orgUnitsTableColumns = (
    formatMessage,
    component,
    classes,
    searches,
) => {
    const columns = [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.type),
            accessor: 'org_unit_type_id',
            Cell: settings => (
                <section>
                    {settings.original.org_unit_type_name}
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.groups),
            accessor: 'groups',
            Cell: settings => (
                <section>
                    {
                        settings.original.groups && settings.original.groups.length > 0
                        && settings.original.groups.map(g => g.name).join(', ')
                    }
                    {
                        (!settings.original.groups || settings.original.groups.length === 0)
                        && textPlaceholder
                    }
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.source),
            accessor: 'source',
            Cell: settings => (
                <section>
                    {
                        settings.original.source && settings.original.source
                    }
                    {
                        !settings.original.source && textPlaceholder
                    }
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.updated_at).format('DD/MM/YYYY HH:mm')}
                </section>
            ),
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </section>
            ),
        },
        {
            resizable: false,
            sortable: false,
            width: 150,
            Cell: settings => (
                <section>
                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.details}
                    />
                    {
                        (settings.original.has_geo_json
                            || (Boolean(settings.original.latitude && settings.original.longitude)))
                        && (
                            <IconButtonComponent
                                url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}/tab/map`}
                                icon="map"
                                tooltipMessage={MESSAGES.map}
                            />
                        )
                    }

                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}/tab/history`}
                        icon="history"
                        tooltipMessage={MESSAGES.history}
                    />
                </section>
            ),
        },
    ];
    const searchCount = searches.length;
    if (searchCount > 1) {
        columns.unshift(
            {
                Header: formatMessage(MESSAGES.search),
                accessor: 'search_index',
                width: 100,
                Cell: settings => (
                    <section>
                        <span
                            style={{
                                backgroundColor: `#${settings.original.color}`,
                                border: `2px solid ${Color(`#${settings.original.color}`).darken(0.5)}`,
                            }}
                            className={classes.roundColor}
                        />
                    </section>
                ),
            },
        );
    }
    return columns;
};

export const orgUnitsLogsColumns = (formatMessage, classes) => ([
    {
        Header: 'ID',
        accessor: 'id',
        width: 100,
    },
    {
        Header: formatMessage(MESSAGES.date),
        accessor: 'created_at',
        Cell: settings => <span>{moment(settings.original.created_at).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
        Header: formatMessage(MESSAGES.user),
        accessor: 'user__username',
        Cell: settings => (
            <span>
                {settings.original.user.userName}
            </span>
        ),
    },
    {
        expander: true,
        width: 65,
        // eslint-disable-next-line react/prop-types
        Expander: ({ isExpanded }) => (
            isExpanded
                ? (
                    <VisibilityOff />
                )
                : (
                    <Tooltip
                        classes={{
                            popper: classes.popperFixed,
                        }}
                        title={formatMessage(MESSAGES.details)}
                    >
                        <Visibility />
                    </Tooltip>
                )
        ),
    },
]
);
