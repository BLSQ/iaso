import React from 'react';
import moment from 'moment';
import { Tooltip } from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import Color from 'color';
import { baseUrls } from '../../constants/urls';
import RowButtonComponent from '../../components/buttons/RowButtonComponent';

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
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.orgUnits.name',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'iaso.orgUnits.type',
            }),
            accessor: 'org_unit_type_id',
            Cell: settings => (
                <section>
                    {settings.original.org_unit_type_name}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Groups',
                id: 'iaso.label.groups',
            }),
            accessor: 'groups',
            Cell: settings => (
                <section>
                    {
                        settings.original.groups.length > 0
                        && settings.original.groups.map(g => g.name).join(', ')
                    }
                    {
                        settings.original.groups.length === 0
                        && '--'
                    }
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'iaso.orgUnits.source',
            }),
            accessor: 'source',
            Cell: settings => (
                <section>
                    {
                        settings.original.source
                    }
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.label.updated_at',
            }),
            accessor: 'updated_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.updated_at).format('DD/MM/YYYY HH:mm')}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
                id: 'iaso.label.created_at',
            }),
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
                    <RowButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={{ id: 'iaso.label.details', defaultMessage: 'Details' }}
                    />
                    {
                        (settings.original.has_geo_json
                            || (Boolean(settings.original.latitude && settings.original.longitude)))
                        && (
                            <RowButtonComponent
                                url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}/tab/map`}
                                icon="map"
                                tooltipMessage={{ id: 'iaso.label.map', defaultMessage: 'Map' }}
                            />
                        )
                    }

                    <RowButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.id}/tab/history`}
                        icon="history"
                        tooltipMessage={{ id: 'iaso.label.history', defaultMessage: 'History' }}
                    />
                </section>
            ),
        },
    ];
    const searchCount = searches.length;
    if (searchCount > 1) {
        columns.unshift(
            {
                Header: formatMessage({
                    defaultMessage: 'Search',
                    id: 'iaso.label.search',
                }),
                accessor: 'search_index',
                width: 100,
                Cell: settings => (
                    <section>
                        {
                            searches[settings.original.search_index]
                            && (
                                <span
                                    style={{
                                        backgroundColor: `#${searches[settings.original.search_index].color}`,
                                        border: `2px solid ${Color(`#${searches[settings.original.search_index].color}`).darken(0.5)}`,
                                    }}
                                    className={classes.roundColor}
                                />
                            )
                        }
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
        Header: formatMessage({
            defaultMessage: 'Date',
            id: 'iaso.label.date',
        }),
        accessor: 'created_at',
        Cell: settings => <span>{moment(settings.original.created_at).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'User',
            id: 'iaso.label.user',
        }),
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
                        title={formatMessage({
                            defaultMessage: 'Details',
                            id: 'iaso.label.details',
                        })}
                    >
                        <Visibility />
                    </Tooltip>
                )
        ),
    },
]
);
