import { useMemo } from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import MESSAGES from './messages';

export const useGetUserRolesColumns = (): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.name),
                accessor: 'name',
                id: 'name',
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'name',
                id: 'tes_name',
            },
            // {
            //     Header: formatMessage(MESSAGES.actions),
            //     accessor: 'actions',
            //     resizable: false,
            //     sortable: false,
            //     Cell: (settings): ReactElement => {
            //         return (
            //             <>
            //                 <EditUserRoleDialog
            //                     dialogType="edit"
            //                     id={settings.row.original.id}
            //                     name={settings.row.original.name}
            //                     permissions={settings.row.original.permissions}
            //                     iconProps={{}}
            //                 />
            //                 <DeleteDialog
            //                     keyName="userRole"
            //                     titleMessage={MESSAGES.delete}
            //                     onConfirm={() =>
            //                         deleteUserRole(settings.row.original)
            //                     }
            //                 />
            //             </>
            //         );
            //     },
            // },
        ];
        return columns;
    }, [formatMessage]);
};
