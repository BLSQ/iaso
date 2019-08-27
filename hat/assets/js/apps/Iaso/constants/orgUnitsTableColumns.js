import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';
import Map from '@material-ui/icons/Map';

import MESSAGES from '../components/forms/messages';

const orgUnitsTableColumns = (formatMessage, component) => (
    [
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
                defaultMessage: 'Source',
                id: 'iaso.orgUnits.source',
            }),
            accessor: 'source',
            Cell: settings => (
                <section>
                    {
                        settings.original.source && formatMessage(MESSAGES[settings.original.source])
                    }
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.orgUnits.updated_at',
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
                id: 'iaso.orgUnits.created_at',
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
                    {
                        (settings.original.has_geo_json
                            || (settings.original.latitude && settings.original.longitude))
                        && (

                            <Tooltip title={<FormattedMessage id="iaso.label.map" defaultMessage="Map" />}>
                                <IconButton
                                    color="primary"
                                    onClick={() => component.selectOrgUnit(settings.original, true)}
                                >
                                    <Map />
                                </IconButton>
                            </Tooltip>
                        )
                    }

                    <Tooltip title={<FormattedMessage id="iaso.orgUnits.details" defaultMessage="Details" />}>
                        <IconButton
                            color="primary"
                            onClick={() => component.selectOrgUnit(settings.original)}
                        >
                            <RemoveRedEye />
                        </IconButton>
                    </Tooltip>
                </section>
            ),
        },
    ]
);
export default orgUnitsTableColumns;
