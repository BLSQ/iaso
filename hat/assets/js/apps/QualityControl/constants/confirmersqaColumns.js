import React from 'react';

import { renderCountCell } from '../../../utils';

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
                            (settings.original.checked + " (" + (settings.original.checked / settings.original.confirmation_video_count * 100).toFixed(1) + "%)")
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
                            (settings.original.checked_ok + " (" + (settings.original.checked_ok / settings.original.checked * 100).toFixed(1) + "%)")
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
                            (settings.original.checked_ko + " (" + (settings.original.checked_ko / settings.original.checked * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Illisibles',
                id: 'monitoring.label.checkedUnreadable',
            }),
            accessor: 'checked_unreadable',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_unreadable)) ?
                            (settings.original.checked_unreadable + " (" + (settings.original.checked_unreadable / settings.original.checked_ko * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'A problème',
                id: 'monitoring.label.checkedInvalid',
            }),
            accessor: 'checked_invalid',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        !isNaN(settings.original.checked_invalid) ?
                            (settings.original.checked_invalid + " (" + (settings.original.checked_invalid / settings.original.checked_ko * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
    ]
);
export default confirmersColumns;

// settings.original.pg_count,
// settings.original.pl_count_positive,
// settings.original.pl_count_stage1,
// settings.original.pl_count_stage2,
// formatMessage,
