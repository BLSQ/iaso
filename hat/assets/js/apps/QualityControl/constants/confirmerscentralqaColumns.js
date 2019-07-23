import React from 'react';

import { renderCountCell } from '../../../utils';

function formatPercentage(value) {
    if (isNaN(value)) {
        return 0;
    } else {
        return value;
    }
}

const screenersColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'monitoring.label.name',
            }),
            accessor: 'tester__user__last_name',
            className: 'small',
            Cell: settings => <span>{`${settings.original.tester__user__first_name} ${settings.original.tester__user__last_name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Coordination',
                id: 'monitoring.label.coordination',
            }),
            className: 'small',
            accessor: 'tester__team__coordination__name',
            Cell: settings => <span>{`${settings.original.tester__team__coordination__name === null ? '--' : settings.original.tester__team__coordination__name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Videos',
                id: 'monitoring.label.videos',
            }),
            accessor: 'confirmation_video_count',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.confirmation_video_count)) ?
                            (settings.original.confirmation_video_count)
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Vérifiés',
                id: 'monitoring.label.checked',
            }),
            accessor: 'checked',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked)) ?
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
                        (!isNaN(settings.original.checked_ok_central)) ?
                            (settings.original.checked_ok_central + " (" + formatPercentage(settings.original.checked_ok_central / (settings.original.checked) * 100).toFixed(1) + "%)")
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: '= terrain',
                id: 'monitoring.label.coordmatch',
            }),
            accessor: 'checked_ok',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_ok)) ?
                            (settings.original.checked_ok + " (" + formatPercentage(settings.original.checked_ok / (settings.original.checked) * 100).toFixed(1) + "%)")
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: '<> coord.',
                id: 'monitoring.label.centralmatch',
            }),
            accessor: 'checked_ko_central',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_ko_central)) ?
                            (settings.original.checked_ko_central + ' (' + formatPercentage(settings.original.checked_ko_central / (settings.original.checked) * 100).toFixed(1) + '%)')
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: '<> terrain',
                id: 'monitoring.label.coordmatch',
            }),
            accessor: 'checked_ko',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_mismatch)) ?
                            (settings.original.checked_mismatch + ' (' + formatPercentage(settings.original.checked_mismatch / (settings.original.checked) * 100).toFixed(1) + '%)')
                            : '-'
                    }
                </span>
            ),
        },
    ]
);
export default screenersColumns;
