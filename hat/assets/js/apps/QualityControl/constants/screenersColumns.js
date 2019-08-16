import React from 'react';

import { renderCountCell } from '../../../utils';

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
                defaultMessage: 'Screening tests',
                id: 'statspage.screening.header.results',
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
            Header: 'CATT +',
            accessor: 'positive_catt_count',
            className: 'small',
        },
        {
            Header: 'CATT -',
            accessor: 'negative_catt_count',
            className: 'small',
        },
        {
            Header: 'RDT +',
            accessor: 'positive_rdt_count',
            className: 'small',
        },
        {
            Header: 'RDT -',
            accessor: 'negative_rdt_count',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Total Images',
                id: 'monitoring.label.picturesTotal',
            }),
            accessor: 'test_pictures',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.rdt_test_pictures + settings.original.catt_test_pictures
                    }
                </span>
            ),
        },
    ]
);
export default screenersColumns;
