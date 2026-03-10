import React, { FunctionComponent, useMemo } from 'react';
import {
    Column,
    Table,
    useSafeIntl,
} from 'bluesquare-components';
import PermissionTooltip from 'Iaso/domains/users/components/PermissionTooltip';
import MESSAGES from 'Iaso/domains/users/messages';
import PERMISSIONS_MESSAGES from 'Iaso/domains/users/permissionsMessages';

type Props = {
    data: string[];
};


const usePermissionTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const columns = [
            {
                Header: '',
                id: 'tooltip',
                sortable: false,
                align: 'center',
                width: 50,
                Cell: settings => {
                    return (
                        <PermissionTooltip
                            codename={`${settings.row.original}_tooltip`}
                        />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.permissions),
                id: 'permissionName',
                accessor: 'permissionName',
                sortable: false,
                width: 250,
                align: 'left',
                Cell: settings => {
                    return PERMISSIONS_MESSAGES?.[settings.row.original] ? formatMessage(PERMISSIONS_MESSAGES?.[settings.row.original]) : settings.row.original;
                },
            },
        ];
        return columns;
    }, [
        formatMessage,
    ]);
};
export const PermissionTable: FunctionComponent<Props> = ({ data }) => {

    const columns: Column[] = usePermissionTableColumns();

    return (
        <>
            <Table
                columns={columns}
                data={data}
                showPagination={false}
                countOnTop={false}
                marginTop={false}
                marginBottom={false}
                elevation={0}
            />
        </>
    );
};
