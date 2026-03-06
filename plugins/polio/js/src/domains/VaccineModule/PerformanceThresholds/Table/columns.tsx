import { useMemo } from 'react';
import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DateTimeCellRfc } from 'Iaso/components/Cells/DateTimeCell';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { POLIO_PERFORMANCE_THRESHOLD_WRITE_PERMISSION } from '../../../../../src/constants/permissions';
import { useDeletePerformanceThreshold } from '../hooks/api';

import { useGetJSonLogicConverter } from '../hooks/useGetJsonLogicToString';
import MESSAGES from '../messages';
import { EditPerformanceThreshold } from '../Modal/CreateEditModal';

export const useTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { mutate: deleteThreshold } = useDeletePerformanceThreshold();
    const hasActionPermission = userHasOneOfPermissions(
        [POLIO_PERFORMANCE_THRESHOLD_WRITE_PERMISSION],
        currentUser,
    );
    const convertJsonLogicToString = useGetJSonLogicConverter();
    return useMemo(() => {
        const columns = [
            {
                Header: 'Id',
                accessor: 'id',
                width: 80,
            },
            {
                Header: formatMessage(MESSAGES.indicator),
                accessor: 'indicator',
            },
            {
                Header: formatMessage(MESSAGES.successThreshold),
                accessor: 'success_threshold',
                sortable: false,
                Cell: ({ value }) => convertJsonLogicToString(value),
            },
            {
                Header: formatMessage(MESSAGES.warningThreshold),
                accessor: 'warning_threshold',
                sortable: false,
                Cell: ({ value }) => convertJsonLogicToString(value),
            },
            {
                Header: formatMessage(MESSAGES.failThreshold),
                accessor: 'fail_threshold',
                sortable: false,
                Cell: ({ value }) => convertJsonLogicToString(value),
            },
            {
                Header: formatMessage(MESSAGES.createdAt),
                accessor: 'created_at',
                sortable: false,
                Cell: DateTimeCellRfc,
            },
            {
                Header: formatMessage(MESSAGES.updatedAt),
                accessor: 'updated_at',
                sortable: false,
                Cell: DateTimeCellRfc,
            },
        ];
        if (hasActionPermission) {
            columns.push({
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                Cell: (settings: any) => {
                    const { original: performanceThreshold } = settings.row;

                    return (
                        <>
                            <EditPerformanceThreshold
                                performanceThreshold={performanceThreshold}
                                iconProps={{}}
                            />

                            <DeleteModal
                                key={`${performanceThreshold.id}`}
                                type="icon"
                                titleMessage={formatMessage(
                                    MESSAGES.deletePerformanceThreshold,
                                    {
                                        name: performanceThreshold.indicator,
                                    },
                                )}
                                onConfirm={() =>
                                    deleteThreshold(performanceThreshold.id)
                                }
                                backdropClick
                            />
                        </>
                    );
                },
            });
        }
        return columns;
    }, [
        formatMessage,
        hasActionPermission,
        deleteThreshold,
        convertJsonLogicToString,
    ]);
};
