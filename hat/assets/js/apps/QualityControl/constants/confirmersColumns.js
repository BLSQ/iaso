import React from 'react';

import { renderCountCell } from '../../../utils';

const confirmersColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'main.label.name',
            }),
            className: 'small',
            accessor: 'tester__user__last_name',
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
                defaultMessage: 'Confirmation tests',
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
                id: 'main.label.stage',
            })} 1`,
            className: 'small',
            accessor: 'pl_count_stage1',
        },
        {
            Header: `${formatMessage({
                defaultMessage: 'Stage',
                id: 'main.label.stage',
            })} 2`,
            className: 'small',
            accessor: 'pl_count_stage2',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Videos',
                id: 'main.label.videos',
            }),
            accessor: 'confirmation_video_count',
            className: 'small',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_video_count, settings.original.confirmation_positive_video_count, formatMessage),
        },
    ]
);
export default confirmersColumns;
