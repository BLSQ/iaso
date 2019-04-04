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
    ]
);
export default screenersColumns;
