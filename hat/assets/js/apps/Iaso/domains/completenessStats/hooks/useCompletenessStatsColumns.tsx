import React, { useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useCompletenessStatsColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.parent),
                id: 'ou.parent',
                accessor: 'ou.parent',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>{settings.row.original.ou?.parent ?? '--'}</span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                id: 'ou.org_unit_type_name',
                accessor: 'ou.org_unit_type_name',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.ou?.org_unit_type_name ??
                                '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'ou.name',
                accessor: 'ou.name',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>{settings.row.original.ou?.name ?? '--'}</span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.form),
                id: 'form.name',
                accessor: 'form.name',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>{settings.row.original.form?.name ?? '--'}</span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.formsFilled),
                id: 'ou_filled_count',
                accessor: 'ou_filled_count',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.ou_filled_count ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.completeness),
                id: 'ou_to_fill_count',
                accessor: 'ou_to_fill_count',
                sortable: false,
                Cell: settings => {
                    const filled = settings.row.original.ou_filled_count ?? 0;
                    const toFill = settings.row.original.ou_to_fill_count || 1;
                    const completed = Math.round((filled / toFill) * 100);
                    return <span>{completed}</span>;
                },
            },
        ],
        [formatMessage],
    );
};
