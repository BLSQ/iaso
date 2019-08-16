import React from 'react';
import moment from 'moment';

const qualityColumns = formatMessage => (
    [
        {
            Header: 'Id',
            accessor: 'id',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'main.label.date',
            }),
            accessor: 'date',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.date).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Tester',
                id: 'main.label.tester',
            }),
            accessor: 'tester__user__username',
            Cell: settings => (
                <span>
                    {settings.original.tester ? settings.original.tester.userName : formatMessage({defaultMessage: '*Inconnu*', id: 'main.label.testerUnknown'})}
                    {settings.original.tester && ` (${settings.original.tester.firstName}${settings.original.tester.lastName ? `${settings.original.tester.lastName}` : ''})`}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'main.label.type',
            }),
            accessor: 'type',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'main.label.province',
            }),
            accessor: 'village__province_name',
            Cell: settings => (
                <span>
                    {settings.original.village &&
                        settings.original.village.province_name ? settings.original.village.province_name : '--'}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Zone',
                id: 'main.label.zone_short',
            }),
            accessor: 'village__ZS_name',
            Cell: settings => (
                <span>
                    {settings.original.village &&
                        settings.original.village.ZS_name ? settings.original.village.ZS_name : '--'}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Area',
                id: 'main.label.area_short',
            }),
            accessor: 'village__AS_name',
            Cell: settings => (
                <span>
                    {settings.original.village &&
                        settings.original.village.AS_name ? settings.original.village.AS_name : '--'}
                </span>
            ),
        },
    ]
);
export default qualityColumns;
