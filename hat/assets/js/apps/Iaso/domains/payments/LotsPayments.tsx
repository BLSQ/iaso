import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box, useTheme } from '@mui/material';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import { PotentialPaymentParams } from './types';
import { useGetPaymentLots } from './hooks/requests/useGetPaymentLots';
import { usePaymentLotsColumns } from './hooks/config/usePaymentLotsColumns';
import { PaymentLotsFilters } from './components/CreatePaymentLot/PaymentLotsFilters';
import { SimpleTableWithDeepLink } from '../../components/tables/SimpleTableWithDeepLink';

type Props = {
    params: PotentialPaymentParams;
};
const baseUrl = baseUrls.lotsPayments;
export const LotsPayments: FunctionComponent<Props> = ({ params }) => {
    // const dispatch = useDispatch();

    const theme = useTheme();
    // Replaced isFetching with isLoading to avoid flicker effect when refreshing data, eg when PATCHing a payment
    const { data, isLoading } = useGetPaymentLots(params);
    const { formatMessage } = useSafeIntl();
    const columns = usePaymentLotsColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lots)}
                displayBackButton={false}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                <PaymentLotsFilters params={params} />
                {/* @ts-ignore */}
                <SimpleTableWithDeepLink
                    marginTop={false}
                    data={data}
                    defaultSorted={[{ id: 'created_at', desc: true }]}
                    columns={columns}
                    baseUrl={baseUrl}
                    params={params}
                    extraProps={{ loading: isLoading }}
                />
            </Box>
        </>
    );
};
