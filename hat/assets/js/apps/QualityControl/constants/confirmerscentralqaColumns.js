import React from 'react';

import formatPercentage from '../utils';

const screenersColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'main.label.name',
            }),
            accessor: 'tester__user__last_name',
            className: 'small',
            Cell: settings => <span>{`${settings.original.tester__user__first_name} ${settings.original.tester__user__last_name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Coordination',
                id: 'main.label.coordination',
            }),
            className: 'small',
            accessor: 'tester__team__coordination__name',
            Cell: settings => <span>{`${settings.original.tester__team__coordination__name === null ? '--' : settings.original.tester__team__coordination__name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Videos',
                id: 'main.label.videos',
            }),
            accessor: 'confirmation_video_count',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.confirmation_video_count !== undefined ?
                            (settings.original.confirmation_video_count)
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Checked',
                id: 'main.label.checked',
            }),
            accessor: 'checked',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.checked !== undefined ?
                            (settings.original.checked)
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: '= coord.',
                id: 'monitoring.label.centralmatch',
            }),
            accessor: 'checked_ok_central',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_ok_central !== undefined) ?
                            `${settings.original.checked_ok_central} (${formatPercentage(
                                settings.original.checked_ok_central, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: '= field',
                id: 'monitoring.label.coordmatch',
            }),
            accessor: 'checked_ok',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_ok !== undefined) ?
                            `${settings.original.checked_ok} (${formatPercentage(settings.original.checked_ok, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: '<> coord.',
                id: 'monitoring.label.notcentralmatch',
            }),
            accessor: 'checked_ko_central',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_ko_central !== undefined) ?
                            `${settings.original.checked_ko_central} (${formatPercentage(settings.original.checked_ko_central, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: '<> terrain',
                id: 'monitoring.label.notcoordmatch',
            }),
            accessor: 'checked_ko',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_mismatch !== undefined) ?
                            `${settings.original.checked_mismatch} (${formatPercentage(settings.original.checked_mismatch, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
    ]
);
export default screenersColumns;
