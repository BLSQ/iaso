import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../messages';
import { DateTimeCellRfc } from 'Iaso/components/Cells/DateTimeCell';
import { EditPerformanceThreshold } from '../Modal/CreateEditModal';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useDeletePerformanceThreshold } from '../hooks/api';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import {
    POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
    POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
} from '../../../../../src/constants/permissions';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import React from 'react';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';

import { useGetJSonLogicConverter } from '../hooks/useGetJsonLogicToString';

export const useTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { mutate: deleteThreshold } = useDeletePerformanceThreshold();
    const hasActionPermission = userHasOneOfPermissions(
        [
            POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
            POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
        ],
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
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
                                    POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
                                ]}
                            >
                                <EditPerformanceThreshold
                                    performanceThreshold={performanceThreshold}
                                    iconProps={{}}
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
                                ]}
                            >
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
                            </DisplayIfUserHasPerm>
                        </>
                    );
                },
            });
            return columns;
        }
    }, [
        formatMessage,
        hasActionPermission,
        deleteThreshold,
        currentUser,
        convertJsonLogicToString,
    ]);
};
