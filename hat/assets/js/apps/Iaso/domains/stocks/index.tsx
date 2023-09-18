import React, { FunctionComponent } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import { useDispatch } from 'react-redux';
import TopBar from '../../components/nav/TopBarComponent';

import MESSAGES from './messages';
import { StocksParams } from './types/stocks';
import { useGetStockMouvements } from './hooks/useGetStockMouvements';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { redirectToReplace } from '../../routing/actions';
import { useGetMovementsColumns } from './hooks/useGetMovementsColumns';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: StocksParams;
};
export const baseUrl = baseUrls.stocks;
export const defaultSorted = [{ id: 'creation_date', desc: false }];

export const Stocks: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetStockMouvements(params);
    const columns = useGetMovementsColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={defaultSorted}
                    columns={columns}
                    count={data?.count ?? 0}
                    params={params}
                    onTableParamsChange={p =>
                        dispatch(redirectToReplace(baseUrl, p))
                    }
                    extraProps={{ loading: isFetching }}
                    columnSelectorEnabled={false}
                />
            </Box>
        </>
    );
};
