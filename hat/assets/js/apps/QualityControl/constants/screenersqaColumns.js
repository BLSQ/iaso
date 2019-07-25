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
                defaultMessage: 'Total',
                id: 'monitoring.label.picturesTotal',
            }),
            accessor: 'test_pictures',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.test_pictures
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
                            (settings.original.checked + " (" + formatPercentage(settings.original.checked / (settings.original.test_pictures) * 100).toFixed(1) + "%)")
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
            accessor: 'checked',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_ok)) ?
                            (settings.original.checked_ok + " (" + formatPercentage(settings.original.checked_ok / (settings.original.checked) * 100).toFixed(1) + "%)")
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
                        (!isNaN(settings.original.checked_invalid)) ?
                            ((settings.original.checked_unreadable + settings.original.checked_invalid + settings.original.checked_mismatch) + " (" + formatPercentage((settings.original.checked_unreadable + settings.original.checked_invalid + settings.original.checked_mismatch) / (settings.original.checked) * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Illisible',
                id: 'monitoring.label.checked_unreadable',
            }),
            accessor: 'checked_unreadable',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_unreadable)) ?
                            (settings.original.checked_unreadable + " (" + formatPercentage(settings.original.checked_unreadable / (settings.original.checked_ko) * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Invalide',
                id: 'monitoring.label.checkedInvalid',
            }),
            accessor: 'checked_invalid',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_invalid)) ?
                            (settings.original.checked_invalid + " (" + formatPercentage(settings.original.checked_invalid / (settings.original.checked_ko) * 100).toFixed(1) + "%)")
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Non concordants',
                id: 'monitoring.label.checked_mismatch',
            }),
            accessor: 'checked',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (!isNaN(settings.original.checked_mismatch)) ?
                            (settings.original.checked_mismatch + " (" + formatPercentage(settings.original.checked_mismatch / (settings.original.checked_ko) * 100).toFixed(1) + "%)")
                            : "-"
                    }
                </span>
            ),
        }
    ]
);
export default screenersColumns;
