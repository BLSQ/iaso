import React from 'react';

import { renderCountCell } from '../../../utils';

const confirmersColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'monitoring.label.name',
            }),
            class: 'small',
            accessor: 'tester__user__last_name',
            Cell: settings => <span>{`${settings.original.tester__user__first_name} ${settings.original.tester__user__last_name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Tests de confirmation',
                id: 'monitoring.label.confirmation_count',
            }),
            class: 'small',
            accessor: 'confirmation_count',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_count, settings.original.positive_confirmation_test_count, formatMessage),
        },
        {
            Header: 'PG',
            class: 'small',
            accessor: 'pg_count',
            Cell: settings =>
                renderCountCell(settings.original.pg_count, settings.original.pg_count_positive, formatMessage),
        },
        {
            Header: 'MAECT',
            class: 'small',
            accessor: 'maect_count',
            Cell: settings =>
                renderCountCell(settings.original.maect_count, settings.original.maect_count_positive, formatMessage),
        },
        {
            Header: 'PL',
            class: 'small',
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
            class: 'small',
            accessor: 'pl_count_stage1',
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Stage',
                id: 'monitoring.label.stade',
            })} 2`,
            class: 'small',
            accessor: 'pl_count_stage2',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Vidéos',
                id: 'monitoring.label.vidéos',
            }),
            accessor: 'confirmation_video_count',
            class: 'small',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_video_count, settings.original.confirmation_positive_video_count, formatMessage),
        },
    ]
);
export default confirmersColumns;

// settings.original.pg_count,
// settings.original.pl_count_positive,
// settings.original.pl_count_stage1,
// settings.original.pl_count_stage2,
// formatMessage,
