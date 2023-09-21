import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import { StocksParams } from './types/stocks';
import MESSAGES from './messages';
import { useGetStockMovements } from './hooks/requests/useGetStockMovements';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { redirectToReplace } from '../../routing/actions';
import { useGetMovementsColumns } from './hooks/useGetMovementsColumns';
import { Filters } from './components/Filters';
import { AddStockMovementDialog } from './components/AddStockMovementDialog';

const baseUrl = baseUrls.stocks;
export const defaultSorted = [{ id: 'creation_date', desc: false }];

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    title: {
        display: 'none',
    },
}));

type Props = {
    params: StocksParams;
};

export const Stocks: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetStockMovements(params);
    const columns = useGetMovementsColumns();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Box display="flex" justifyContent="flex-end">
                    <AddStockMovementDialog
                        iconProps={{}}
                        titleMessage={formatMessage(MESSAGES.addStockMovement)}
                    />
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    count={data?.count ?? 0}
                    params={params}
                    columns={columns}
                    defaultSorted={defaultSorted}
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
