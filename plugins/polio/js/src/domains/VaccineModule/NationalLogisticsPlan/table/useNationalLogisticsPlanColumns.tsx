import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { useCurrentUser } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { userHasOneOfPermissions } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import {
    POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
    POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
} from '../../../../constants/permissions';
import MESSAGES from '../messages';
import { EditNationalLogisticsPlanModal } from '../modals/CreateEditModal';
import { useDeleteNationalLogisticsPlan } from '../hooks/api';
import { DeleteModal } from 'Iaso/components/DeleteRestoreModals/DeleteModal';

export const useNationalLogisticsPlanColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { mutate: deleteNationalLogisticsPlan } =
        useDeleteNationalLogisticsPlan();

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
        ];

        const hasActionPermission = userHasOneOfPermissions(
            [
                POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
                POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
            ],
            currentUser,
        );

        if (hasActionPermission) {
            columns.push({
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                Cell: (settings: any) => {
                    const { original: nationaPlanData } = settings.row;
                    const recordName = `${nationaPlanData.country_name} - ${nationaPlanData.date}`;
                    return (
                        <>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
                                    POLIO_COUNTRY_PLAN_NON_ADMIN_PERMISSION,
                                ]}
                            >
                                <EditNationalLogisticsPlanModal
                                    nationaPlanData={nationaPlanData}
                                    iconProps={{}}
                                />
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    POLIO_COUNTRY_PLAN_ADMIN_PERMISSION,
                                ]}
                            >
                                <DeleteModal
                                    key={`${nationaPlanData.id}`}
                                    type="icon"
                                    titleMessage={formatMessage(
                                        MESSAGES.deleteNationalLogisticsPlan,
                                        { name: recordName },
                                    )}
                                    onConfirm={() =>
                                        deleteNationalLogisticsPlan(
                                            nationaPlanData.id,
                                        )
                                    }
                                    backdropClick
                                />
                            </DisplayIfUserHasPerm>
                        </>
                    );
                },
            });
        }
        return columns;
    }, [formatMessage, currentUser, deleteNationalLogisticsPlan]);
};
