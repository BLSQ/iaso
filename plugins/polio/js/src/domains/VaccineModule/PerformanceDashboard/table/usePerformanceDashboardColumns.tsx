import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import {
    POLIO_PERFORMANCE_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
} from '../../../../constants/permissions';
import MESSAGES from '../messages';
import { EditPerformanceModal } from '../modals/CreateEditModal';
import { DeletePerformanceModal } from '../modals/DeleteModal';

export const usePerformanceDashboardColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();

    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'country_name',
                id: 'country_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.date),
                accessor: 'date',
                id: 'date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'status',
                id: 'status',
                sortable: true,
                Cell: ({ value }: { value: string }) =>
                    MESSAGES[value.toLowerCase()]
                        ? formatMessage(MESSAGES[value.toLowerCase()])
                        : value,
            },
            {
                Header: formatMessage(MESSAGES.antigen),
                accessor: 'vaccine',
                id: 'vaccine',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.createdAt),
                accessor: 'created_at',
                id: 'created_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.updatedAt),
                accessor: 'updated_at',
                id: 'updated_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                Cell: (settings: any) => {
                    const { original: performanceData } = settings.row;
                    return (
                        <>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_PERFORMANCE_ADMIN_PERMISSION,
                                    POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
                                ]}
                            >
                                <EditPerformanceModal
                                    performanceData={performanceData}
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_PERFORMANCE_ADMIN_PERMISSION,
                                ]}
                            >
                                <DeletePerformanceModal
                                    performanceData={performanceData}
                                />
                            </DisplayIfUserHasPerm>
                        </>
                    );
                },
            },
        ];

        return columns;
    }, [formatMessage]);
};
