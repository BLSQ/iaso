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
                id: 'parent_org_unit.name',
                accessor: 'parent_org_unit.name',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.parent_org_unit?.[0].name ??
                                '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                id: 'org_unit_type.name',
                accessor: 'org_unit_type.name',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.org_unit_type?.name ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'org_unit.name',
                accessor: 'org_unit.name',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.org_unit?.name ?? '--'}
                        </span>
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
