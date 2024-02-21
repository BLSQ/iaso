import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { PotentialPaymentParams } from './types';
import { useGetPotentialPayments } from './hooks/requests/useGetPotentialPayments';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
// import { useGetUserRolesColumns } from './config';
import { redirectTo } from '../../routing/actions';
import { usePotentialPaymentColumns } from './config/usePotentialPaymentColumns';

type Props = {
    params: PotentialPaymentParams;
};
const baseUrl = baseUrls.potentialPayments;
export const PotentialPayments: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();

    const { data, isFetching } = useGetPotentialPayments(params);
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const columns = usePotentialPaymentColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                {/* <UserRolesFilters params={params} /> */}
                <TableWithDeepLink
                    marginTop={false}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'user__last_name', desc: false }]}
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
