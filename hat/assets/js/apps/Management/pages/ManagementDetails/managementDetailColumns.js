import React from 'react';
import { FormattedDate } from 'react-intl';

const managementDetailColumns = (formatMessage, tableTotal) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'details.label.village',
            }),
            className: 'small',
            accessor: 'village__name',
            Footer: formatMessage({
                defaultMessage: 'TOTAL',
                id: 'details.label.total',
            }),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Jour',
                id: 'details.label.day',
            }),
            className: 'small',
            accessor: 'date',
            Cell: settings => (<FormattedDate value={new Date(settings.original.date)} />),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Dépistages',
                id: 'details.label.screenings',
            }),
            columns: [
                {
                    Header: 'CATT',
                    accessor: 'catt_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_catt : ''),
                },
                {
                    Header: 'RDT',
                    accessor: 'rdt_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_rdt : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Positifs',
                        id: 'details.label.positive',
                    }),
                    accessor: 'positive_screening_test_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_catt_positive + tableTotal.total_rdt_positive : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'TOTAL',
                        id: 'details.label.total',
                    }),
                    accessor: 'screening_count',
                    className: 'small',
                    width: 120,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_catt + tableTotal.total_rdt : ''),
                },
            ],
        },
        {
            Header: formatMessage({
                defaultMessage: 'Confirmations',
                id: 'details.label.confirmations',
            }),
            columns: [
                {
                    Header: 'PG',
                    accessor: 'pg_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_pg : ''),
                },
                {
                    Header: 'CTCWOO',
                    accessor: 'ctcwoo_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_ctc : ''),
                },
                {
                    Header: 'MAECT',
                    accessor: 'maect_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_maect : ''),
                },
                {
                    Header: 'PL',
                    accessor: 'pl_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_pl : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Positifs',
                        id: 'details.label.positive',
                    }),
                    accessor: 'positive_confirmation_test_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_confirmation_tests_positive : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'TOTAL',
                        id: 'details.label.total',
                    }),
                    accessor: 'confirmation_count',
                    className: 'small',
                    width: 120,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_confirmation_tests : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Stade 1',
                        id: 'details.label.pl_count_stage1',
                    }),
                    accessor: 'pl_count_stage1',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_pl_stage1 : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Stade 2',
                        id: 'details.label.pl_count_stage2',
                    }),
                    accessor: 'pl_count_stage2',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? tableTotal.total_pl_stage2 : ''),
                },
            ],
        },
    ]
);
export default managementDetailColumns;
