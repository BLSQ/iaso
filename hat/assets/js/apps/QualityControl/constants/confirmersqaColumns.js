import React from 'react';

import { renderCountCell } from '../../../utils';
import formatPercentage from '../utils';

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
                defaultMessage: 'Videos',
                id: 'main.label.videos',
            }),
            accessor: 'confirmation_video_count',
            className: 'small',
            Cell: settings =>
                renderCountCell(settings.original.confirmation_video_count, settings.original.confirmation_positive_video_count, formatMessage),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Checked',
                id: 'main.label.checked',
            }),
            accessor: 'checked',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked !== undefined) ?
                            `${settings.original.checked} (${formatPercentage(settings.original.checked, settings.original.confirmation_video_count)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Concordant',
                id: 'monitoring.label.checkedOk',
            }),
            accessor: 'checked_ok',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_ok !== undefined) ?
                            `${settings.original.checked_ok} (${formatPercentage(settings.original.checked_ok, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Not concordant',
                id: 'monitoring.label.checkedKo',
            }),
            accessor: 'checked_ko',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_ko !== undefined) ?
                            `${settings.original.checked_ko} (${formatPercentage(settings.original.checked_ko, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Not clear',
                id: 'monitoring.label.checkedIsClear',
            }),
            accessor: 'is_clear',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.is_clear !== undefined) ?
                            `${(settings.original.checked - settings.original.is_clear)} (${formatPercentage(settings.original.checked - settings.original.is_clear, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Wrong place',
                id: 'monitoring.label.checkedGoodPlace',
            }),
            accessor: 'is_good_place',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.is_good_place !== undefined) ?
                            `${(settings.original.checked - settings.original.is_good_place)} (${formatPercentage(settings.original.checked - settings.original.is_good_place, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
    ]
);
export default confirmersColumns;
