import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles, Box } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { UserRolesFilters } from './components/UserRolesFilters';
import { baseUrls } from '../../constants/urls';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { UserRoleParams } from './types/userRoles';
import { useGetUserRolesColumns } from './config';
import { useGetUserRoles } from './hooks/requests/useGetUserRoles';
import { redirectTo } from '../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
type Props = {
    params: UserRoleParams;
};
const baseUrl = baseUrls.userRoles;
export const UserRoles: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();

    const { data, isFetching } = useGetUserRoles(params);
    const { formatMessage } = useSafeIntl();
    const columns = useGetUserRolesColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <UserRolesFilters params={params} />
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
                    onTableParamsChange={p => dispatch(redirectTo(baseUrl, p))}
                />
            </Box>
        </>
    );
};
