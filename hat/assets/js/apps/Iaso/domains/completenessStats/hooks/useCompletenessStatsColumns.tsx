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
                Header: formatMessage(MESSAGES.formsFilledWithDescendants),
                id: 'forms_filled',
                accessor: 'forms_filled',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.forms_filled ?? '--'}/
                            {settings.row.original.forms_to_fill ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.completenessWithDescendants),
                id: 'completeness_ratio',
                accessor: 'completeness_ratio',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.formsFilledDirect),
                id: 'forms_filled_direct',
                accessor: 'forms_filled_direct',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original.forms_filled_direct ?? '--'}/
                            {settings.row.original.forms_to_fill_direct ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.completenessDirect),
                id: 'completeness_ratio_direct',
                accessor: 'completeness_ratio_direct',
                sortable: false,
            },
        ],
        [formatMessage],
    );
};
