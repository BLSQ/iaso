import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { CreateUserRoleDialog } from './components/CreateEditUserRole';
import { UserRolesFilters } from './components/UserRolesFilters';
import { useGetUserRolesColumns } from './config';
import { useDeleteUserRole } from './hooks/requests/useDeleteUserRole';
import { useGetUserRoles } from './hooks/requests/useGetUserRoles';
import MESSAGES from './messages';
import { UserRoleParams } from './types/userRoles';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const baseUrl = baseUrls.userRoles;
export const UserRoles: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as UserRoleParams;
    const classes: Record<string, string> = useStyles();

    const { data, isFetching } = useGetUserRoles(params);
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteUserRole } = useDeleteUserRole();
    const columns = useGetUserRolesColumns(deleteUserRole);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <UserRolesFilters params={params} />
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <CreateUserRoleDialog dialogType="create" iconProps={{}} />
                </Box>
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'group__name', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{ loading: isFetching }}
                />
            </Box>
        </>
    );
};
