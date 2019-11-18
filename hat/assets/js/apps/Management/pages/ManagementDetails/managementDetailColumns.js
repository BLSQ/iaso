import React from 'react';
import { FormattedDate } from 'react-intl';
import { formatThousand } from '../../../../utils';

const managementDetailColumns = (formatMessage, tableTotal) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'main.label.village',
            }),
            className: 'small',
            accessor: 'village__name',
            Footer: formatMessage({
                defaultMessage: 'TOTAL',
                id: 'main.label.total',
            }),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Day',
                id: 'main.label.day',
            }),
            className: 'small',
            accessor: 'date',
            Cell: settings => (<FormattedDate value={new Date(settings.original.date)} />),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Screening',
                id: 'main.label.screening_results',
            }),
            columns: [
                {
                    Header: 'CATT',
                    accessor: 'catt_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_catt) : ''),
                },
                {
                    Header: 'RDT',
                    accessor: 'rdt_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_rdt) : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Positives',
                        id: 'main.label.positives',
                    }),
                    accessor: 'positive_screening_test_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_catt_positive + tableTotal.total_rdt_positive) : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'TOTAL',
                        id: 'main.label.total',
                    }),
                    accessor: 'screening_count',
                    className: 'small',
                    width: 120,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_catt + tableTotal.total_rdt) : ''),
                },
            ],
        },
        {
            Header: formatMessage({
                defaultMessage: 'Confirmations',
                id: 'main.label.confirmation_results',
            }),
            columns: [
                {
                    Header: 'PG',
                    accessor: 'pg_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_pg) : ''),
                },
                {
                    Header: 'CTCWOO',
                    accessor: 'ctcwoo_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_ctc) : ''),
                },
                {
                    Header: 'MAECT',
                    accessor: 'maect_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_maect) : ''),
                },
                {
                    Header: 'PL',
                    accessor: 'pl_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_pl) : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Positifs',
                        id: 'main.label.positives',
                    }),
                    accessor: 'positive_confirmation_test_count',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_confirmation_tests_positive) : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'TOTAL',
                        id: 'main.label.total',
                    }),
                    accessor: 'confirmation_count',
                    className: 'small',
                    width: 120,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_confirmation_tests) : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Stade 1',
                        id: 'main.label.stage1',
                    }),
                    accessor: 'pl_count_stage1',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_pl_stage1) : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Stade 2',
                        id: 'main.label.stage2',
                    }),
                    accessor: 'pl_count_stage2',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_pl_stage2) : ''),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Stade inconnu',
                        id: 'main.label.stageUnk',
                    }),
                    accessor: 'pl_count_stage_unk',
                    className: 'small',
                    width: 80,
                    resizable: false,
                    Footer: () => (tableTotal ? formatThousand(tableTotal.total_pl_stage_unk) : ''),
                },
            ],
        },
    ]
);
export default managementDetailColumns;
