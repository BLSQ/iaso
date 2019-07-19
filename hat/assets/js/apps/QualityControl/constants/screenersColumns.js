import React from 'react';

import { renderCountCell } from '../../../utils';

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
                defaultMessage: 'Tests de dépistage',
                id: 'monitoring.label.screening_count',
            }),
            accessor: 'screening_count',
            className: 'small',
            Cell: settings =>
                renderCountCell(settings.original.screening_count, settings.original.positive_screening_test_count, formatMessage),
        },
        {
            Header: 'CATT',
            accessor: 'catt_count',
            className: 'small',
            Cell: settings =>
                renderCountCell(settings.original.catt_count, settings.original.positive_catt_count, formatMessage),
        },
        {
            Header: 'RDT',
            accessor: 'rdt_count',
            className: 'small',
            Cell: settings =>
                renderCountCell(settings.original.rdt_count, settings.original.positive_rdt_count, formatMessage),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Photos',
                id: 'monitoring.label.pictures',
            }),
            columns: [
                {
                    Header: 'CATT +',
                    accessor: 'catt_test_positive_pictures',
                    className: 'small',
                },
                {
                    Header: 'CATT -',
                    accessor: 'catt_test_negative_pictures',
                    className: 'small',
                },
                {
                    Header: 'RDT +',
                    accessor: 'rdt_test_positive_pictures',
                    className: 'small',
                },
                {
                    Header: 'RDT -',
                    accessor: 'rdt_test_negative_pictures',
                    className: 'small',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Total',
                        id: 'monitoring.label.picturesTotal',
                    }),
                    accessor: 'rdt_count',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                settings.original.rdt_test_pictures + settings.original.catt_test_pictures
                            }
                        </span>
                    ),
                },
            ],
        },
        {
            Header: formatMessage({
                defaultMessage: 'QC',
                id: 'monitoring.label.qc',
            }),
            columns: [
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
                                (settings.original.rdt_test_pictures + settings.original.catt_test_pictures) ?
                                    (settings.original.checked + " (" + (settings.original.checked / (settings.original.rdt_test_pictures + settings.original.catt_test_pictures) * 100).toFixed(1) + "%)")
                                    : "-"
                            }
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Conformes',
                        id: 'monitoring.label.checkedOk',
                    }),
                    accessor: 'checked',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                (settings.original.rdt_test_pictures + settings.original.catt_test_pictures) ?
                                    (settings.original.checked_ok + " (" + (settings.original.checked_ok / (settings.original.rdt_test_pictures + settings.original.catt_test_pictures) * 100).toFixed(1) + "%)")
                                    : "-"
                            }
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Non conformes',
                        id: 'monitoring.label.checkedKo',
                    }),
                    accessor: 'checked',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                (settings.original.rdt_test_pictures + settings.original.catt_test_pictures) ?
                                    (settings.original.checked_ko + " (" + (settings.original.checked_ko / (settings.original.rdt_test_pictures + settings.original.catt_test_pictures) * 100).toFixed(1) + "%)")
                                    : "-"
                            }
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Discordants',
                        id: 'monitoring.label.checkedMismatch',
                    }),
                    accessor: 'checked',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                (settings.original.checked_ko) ?
                                    (settings.original.checked_mismatch + " (" + (settings.original.checked_mismatch / (settings.original.checked_ko) * 100).toFixed(1) + "%)")
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
                                (settings.original.checked_ko) ?
                                    (settings.original.checked_unreadable + " (" + (settings.original.checked_unreadable / (settings.original.checked_ko) * 100).toFixed(1) + "%)")
                                    : "-"
                            }
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Invalides',
                        id: 'monitoring.label.checkedInvalid',
                    }),
                    accessor: 'checked_invalid',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                (settings.original.checked_ko) ?
                                    (settings.original.checked_invalid + " (" + (settings.original.checked_invalid / (settings.original.checked_ko) * 100).toFixed(1) + "%)")
                                    : "-"
                            }
                        </span>
                    ),
                },
            ],
        },
    ]
);
export default screenersColumns;
