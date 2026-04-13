import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { Column, Table, useSafeIntl } from 'bluesquare-components';
import PermissionTooltip from 'Iaso/domains/users/components/PermissionTooltip';
import MESSAGES from 'Iaso/domains/users/messages';
import PERMISSIONS_MESSAGES from 'Iaso/domains/users/permissionsMessages';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    data: string[];
};

const styles: SxStyles = {
    root: {
        width: '100%',
        maxHeight: '307px',
        overflow: 'auto',
        '& thead': {
            display: 'none',
        },
    },
};

const usePermissionTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: '',
                id: 'tooltip',
                sortable: false,
                align: 'center' as const,
                width: 50,
                Cell: ({
                    row: {
                        original: { permissionName },
                    },
                }: {
                    row: { original: { permissionName: string } };
                }) => {
                    return (
                        <PermissionTooltip
                            codename={`${permissionName}_tooltip`}
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
                Cell: ({
                    row: {
                        original: { permissionName },
                    },
                }: {
                    row: { original: { permissionName: string } };
                }) => {
                    const message =
                        permissionName in PERMISSIONS_MESSAGES
                            ? PERMISSIONS_MESSAGES[
                                  permissionName as keyof typeof PERMISSIONS_MESSAGES
                              ]
                            : undefined;
                    return message ? formatMessage(message) : permissionName;
                },
            },
        ];
        return columns;
    }, [formatMessage]);
};
export const PermissionTable: FunctionComponent<Props> = ({ data }) => {
    const columns: Column[] = usePermissionTableColumns();

    return (
        <Box sx={styles.root}>
            <Table
                columns={columns}
                data={data.map(permission => ({
                    permissionName: permission,
                }))}
                showPagination={false}
                countOnTop={false}
                marginTop={false}
                marginBottom={false}
                elevation={0}
            />
        </Box>
    );
};
