import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';
import History from '@material-ui/icons/History';
import Map from '@material-ui/icons/Map';

const orgUnitsTableColumns = (
    formatMessage,
    component,
    classes,
    searchCount,
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
                    <Tooltip
                        classes={{
                            popper: classes.popperFixed,
                        }}
                        title={<FormattedMessage id="iaso.label.details" defaultMessage="Details" />}
                    >
                        <IconButton
                            onClick={() => component.selectOrgUnit(settings.original)}
                        >
                            <RemoveRedEye />
                        </IconButton>
                    </Tooltip>
                    {
                        (settings.original.has_geo_json
                            || (settings.original.latitude && settings.original.longitude))
                        && (

                            <Tooltip
                                classes={{
                                    popper: classes.popperFixed,
                                }}
                                title={<FormattedMessage id="iaso.label.map" defaultMessage="Map" />}
                            >
                                <IconButton
                                    onClick={() => component.selectOrgUnit(settings.original, 'map')}
                                >
                                    <Map />
                                </IconButton>
                            </Tooltip>
                        )
                    }

                    <Tooltip
                        classes={{
                            popper: classes.popperFixed,
                        }}
                        title={<FormattedMessage id="iaso.label.history" defaultMessage="History" />}
                    >
                        <IconButton
                            onClick={() => component.selectOrgUnit(settings.original, 'history')}
                        >
                            <History />
                        </IconButton>
                    </Tooltip>
                </section>
            ),
        },
    ];
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
                        {settings.original.search_index + 1}
                    </section>
                ),
            },
        );
    }
    return columns;
};
export default orgUnitsTableColumns;
