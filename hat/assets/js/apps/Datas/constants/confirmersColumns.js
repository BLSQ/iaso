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
                defaultMessage: 'Tests de confirmation',
                id: 'monitoring.label.confirmation_count',
            }),
            className: 'small',
            accessor: 'confirmation_count',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_count, settings.original.positive_confirmation_test_count, formatMessage),
        },
        {
            Header: 'PG',
            className: 'small',
            accessor: 'pg_count',
            Cell: settings =>
                renderCountCell(settings.original.pg_count, settings.original.pg_count_positive, formatMessage),
        },
        {
            Header: 'MAECT',
            className: 'small',
            accessor: 'maect_count',
            Cell: settings =>
                renderCountCell(settings.original.maect_count, settings.original.maect_count_positive, formatMessage),
        },
        {
            Header: 'PL',
            className: 'small',
            accessor: 'pl_count',
            Cell: settings =>
                renderCountCell(
                    settings.original.pl_count,
                    settings.original.pl_count_positive,
                    formatMessage,
                ),
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Stage',
                id: 'monitoring.label.stade',
            })} 1`,
            className: 'small',
            accessor: 'pl_count_stage1',
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Stage',
                id: 'monitoring.label.stade',
            })} 2`,
            className: 'small',
            accessor: 'pl_count_stage2',
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
                                settings.original.confirmation_video_count ?
                                    (settings.original.checked + " (" + (settings.original.checked / settings.original.confirmation_video_count * 100).toFixed(1) + "%)")
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
                    accessor: 'checked_ok',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                settings.original.confirmation_video_count ?
                                    (settings.original.checked_ok + " (" + (settings.original.checked_ok / settings.original.confirmation_video_count * 100).toFixed(1) + "%)")
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
                    accessor: 'checked_ko',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                settings.original.confirmation_video_count ?
                                    (settings.original.checked_ko + " (" + (settings.original.checked_ko / settings.original.confirmation_video_count * 100).toFixed(1) + "%)")
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
                    accessor: 'checked_mismatch',
                    className: 'small',
                    Cell: settings => (
                        <span>
                            {
                                settings.original.checked_ko ?
                                    (settings.original.checked_mismatch + " (" + (settings.original.checked_mismatch / settings.original.checked_ko * 100).toFixed(1) + "%)")
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
                                settings.original.checked_ko ?
                                    (settings.original.checked_unreadable + " (" + (settings.original.checked_unreadable / settings.original.checked_ko * 100).toFixed(1) + "%)")
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
                                settings.original.checked_ko ?
                                    (settings.original.checked_invalid + " (" + (settings.original.checked_invalid / settings.original.checked_ko * 100).toFixed(1) + "%)")
                                    : "-"
                            }
                        </span>
                    ),
                },
            ],
        },
    ]
);
export default confirmersColumns;

// settings.original.pg_count,
// settings.original.pl_count_positive,
// settings.original.pl_count_stage1,
// settings.original.pl_count_stage2,
// formatMessage,
