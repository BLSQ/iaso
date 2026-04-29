import React from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { LinkToOrgUnit } from 'Iaso/domains/orgUnits/components/LinkToOrgUnit';
import { PaginatedPlanningOrgUnit } from 'Iaso/domains/plannings/types';
import { AssignmentCell } from '../components/AssignmentCell';
import MESSAGES from '../messages';

export const useGetColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: 'Id',
            accessor: 'id',
            sortable: false,
            width: 50,
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            sortable: false,
            Cell: ({
                row: { original: orgUnit },
            }: {
                row: { original: PaginatedPlanningOrgUnit };
            }) => {
                return <LinkToOrgUnit orgUnit={orgUnit} />;
            },
        },
        {
            Header: formatMessage(MESSAGES.assignment),
            accessor: 'assignment',
            sortable: false,
            Cell: AssignmentCell,
        },
    ];
};
