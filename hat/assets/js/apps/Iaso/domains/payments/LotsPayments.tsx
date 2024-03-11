import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@mui/material';
// import { makeStyles } from '@mui/styles';
// import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
// import { UserRolesFilters } from './components/UserRolesFilters';
// import { baseUrls } from '../../constants/urls';
import { PotentialPaymentParams } from './types';
// import { useGetUserRolesColumns } from './config';
// import { redirectTo } from '../../routing/actions';

type Props = {
    params: PotentialPaymentParams;
};
// const baseUrl = baseUrls.userRoles;
export const LotsPayments: FunctionComponent<Props> = ({ params }) => {
    // const dispatch = useDispatch();

    // const { data, isFetching } = useGetUserRoles(params);
    const { formatMessage } = useSafeIntl();
    // const columns = useGetUserRolesColumns(deleteUserRole);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lots)}
                displayBackButton={false}
            />
            <Box>
                LOTS
                {/* <UserRolesFilters params={params} />
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
                /> */}
            </Box>
        </>
    );
};
