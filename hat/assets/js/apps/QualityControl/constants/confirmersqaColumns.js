import React from 'react';

import { renderCountCell } from '../../../utils';

function formatPercentage(value) {
    if (isNaN(value)) {
        return 0;
    } else {
        return value;
    }
}

const confirmersColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'monitoring.label.name',
            }),
            className: 'small',
            accessor: 'tester__user__last_name',
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
                defaultMessage: 'Vidéos',
                id: 'monitoring.label.vidéos',
            }),
            accessor: 'confirmation_video_count',
            className: 'small',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_video_count, settings.original.confirmation_positive_video_count, formatMessage),
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
                        !isNaN(settings.original.checked) ?
                            (settings.original.checked + " (" + formatPercentage(settings.original.checked / settings.original.confirmation_video_count * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Concordant',
                id: 'monitoring.label.checkedOk',
            }),
            accessor: 'checked_ok',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_ok)) ?
                            (settings.original.checked_ok + " (" + formatPercentage(settings.original.checked_ok / settings.original.checked * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Non concordant',
                id: 'monitoring.label.checkedKo',
            }),
            accessor: 'checked_ko',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_ko)) ?
                            (settings.original.checked_ko + " (" + formatPercentage(settings.original.checked_ko / settings.original.checked * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Pas net',
                id: 'monitoring.label.checkedIsClear',
            }),
            accessor: 'is_clear',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.is_clear)) ?
                            (settings.original.is_clear + ' (' + formatPercentage(100 - ((settings.original.is_clear / settings.original.checked) * 100)).toFixed(1) + '%)')
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Mauvais endroit',
                id: 'monitoring.label.checkedGoodPlace',
            }),
            accessor: 'is_good_place',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        !isNaN(settings.original.is_good_place) ?
                            (settings.original.is_good_place + ' (' + formatPercentage(100 - ((settings.original.is_good_place / settings.original.checked) * 100)).toFixed(1) + '%)')
                            : '-'
                    }
                </span>
            ),
        },
    ]
);
export default confirmersColumns;
