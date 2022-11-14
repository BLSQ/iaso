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
                id: 'parent_org_unit__name',
                accessor: 'parent_org_unit__name',
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
                id: 'org_unit_type__name',
                accessor: 'org_unit_type__name',
                sortable: true,
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
                id: 'name',
                accessor: 'name',
                sortable: true,
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
                id: 'form__name',
                accessor: 'form__name',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>{settings.row.original.form?.name ?? '--'}</span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.formsFilled),
                id: 'forms_filled',
                accessor: 'forms_filled',
                sortable: true,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.forms_filled ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.completeness),
                id: 'completeness_ratio',
                accessor: 'completeness_ratio',
                sortable: false,
                // Cell: settings => {
                //     const filled = settings.row.original.ou_filled_count ?? 0;
                //     const toFill = settings.row.original.ou_to_fill_count || 1;
                //     const completed = Math.round((filled / toFill) * 100);
                //     return <span>{completeness_ratio}</span>;
                // },
            },
        ],
        [formatMessage],
    );
};
