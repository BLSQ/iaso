import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';

import { baseUrls } from 'Iaso/constants/urls';

import { ProjectChips } from 'Iaso/domains/projects/components/ProjectChips';
import { SkusActionCell } from 'Iaso/domains/stock/components/ActionCell';
import { ChipsGroup } from 'Iaso/domains/stock/components/ChipsGroup';
import { FormsGroup } from 'Iaso/domains/stock/components/FormsGroup';
import { StockKeepingUnit } from 'Iaso/domains/stock/types/stocks';
import MESSAGES from './messages';

export const baseUrl = baseUrls.stockKeepingUnits;

export const useColumns = (): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: 'Id',
                id: 'id',
                accessor: 'id',
                width: 80,
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.short_name),
                id: 'short_name',
                accessor: 'short_name',
            },
            {
                Header: formatMessage(MESSAGES.projects),
                id: 'projects',
                accessor: 'projects',
                sortable: false,
                Cell: settings => {
                    const { projects } = settings.row.original;
                    return <ProjectChips projects={projects} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitsTypes),
                id: 'orgUnitTypes',
                accessor: 'org_unit_types',
                sortable: false,
                Cell: settings => {
                    const { org_unit_types } = settings.row.original;
                    return ChipsGroup(org_unit_types);
                },
            },
            {
                Header: formatMessage(MESSAGES.forms),
                id: 'forms',
                accessor: 'forms',
                sortable: false,
                Cell: settings => {
                    const { forms } = settings.row.original;
                    return FormsGroup(forms);
                },
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updated_at',
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                resizable: false,
                sortable: false,
                accessor: 'actions',
                Cell: settings => {
                    const sku = settings.row.original as StockKeepingUnit;
                    return <SkusActionCell sku={sku} />;
                },
            },
        ],
        [formatMessage],
    );
};
