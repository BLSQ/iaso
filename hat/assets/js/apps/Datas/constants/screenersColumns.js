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
            class: 'small',
            Cell: settings => <span>{`${settings.original.tester__user__first_name} ${settings.original.tester__user__last_name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Tests de dépistage',
                id: 'monitoring.label.screening_count',
            }),
            accessor: 'screening_count',
            class: 'small',
            Cell: settings =>
                renderCountCell(settings.original.screening_count, settings.original.positive_screening_test_count, formatMessage),
        },
        {
            Header: 'CATT',
            accessor: 'catt_count',
            class: 'small',
            Cell: settings =>
                renderCountCell(settings.original.catt_count, settings.original.positive_catt_count, formatMessage),
        },
        {
            Header: 'RDT',
            accessor: 'rdt_count',
            class: 'small',
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
                    class: 'small',
                },
                {
                    Header: 'CATT -',
                    accessor: 'catt_test_negative_pictures',
                    class: 'small',
                },
                {
                    Header: 'RDT +',
                    accessor: 'rdt_test_positive_pictures',
                    class: 'small',
                },
                {
                    Header: 'RDT -',
                    accessor: 'rdt_test_negative_pictures',
                    class: 'small',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Total',
                        id: 'monitoring.label.picturesTotal',
                    }),
                    accessor: 'rdt_count',
                    class: 'small',
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
                    class: 'small',
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
                    class: 'small',
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
                    class: 'small',
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
                // {
                //     Header: formatMessage({
                //         defaultMessage: 'Illisibles',
                //         id: 'monitoring.label.checkedUnreadable',
                //     }),
                //     accessor: 'checked',
                //     class: 'small',
                //     Cell: settings => (
                //         <span>
                //             {
                //                 settings.original.checked_unreadable + " (" + (settings.original.checked_unreadable / (settings.original.rdt_test_pictures + settings.original.catt_test_pictures) * 100).toFixed(1) + "%)"
                //             }
                //         </span>
                //     ),
                // },
            ],
        },
    ]
);
export default screenersColumns;
