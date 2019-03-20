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
                id: 'quality.label.date',
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
                defaultMessage: 'Testeur',
                id: 'quality.label.tester',
            }),
            accessor: 'tester__userName',
            Cell: settings => (
                <span>
                    {settings.original.tester.userName}
                    {` (${settings.original.tester.firstName} ${settings.original.tester.lastName})`}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'quality.label.type',
            }),
            accessor: 'type',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'quality.label.province',
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
                id: 'quality.label.zone',
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
                defaultMessage: 'Aire',
                id: 'quality.label.area',
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
