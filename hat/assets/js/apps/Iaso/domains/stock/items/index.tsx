import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    Table,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import {
    DetailsFilters,
    ItemsFilters,
} from 'Iaso/domains/stock/items/components/Filters';
import {
    useGetStockItem,
    useGetStockLedgerItemsPaginated,
    useGetStockItemsPaginated,
} from 'Iaso/domains/stock/items/hooks/requests';
import { Params } from 'Iaso/domains/stock/items/types/filters';
import MESSAGES from 'Iaso/domains/stock/messages';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { baseUrl, useColumns, useDetailsColumns } from './config';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const StockItems: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as Params;
    return (
        <>
            {!params.id && <StockItemsList params={params} />}
            {params.id && <StockItemDetails params={params} />}
        </>
    );
};

type Props = {
    params: Params;
};

const StockItemsList: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetStockItemsPaginated(params);
    const redirectTo = useRedirectTo();
    const columns = useColumns();
    return (
        <>
            {isFetching && <LoadingSpinner />}
            <TopBar title={formatMessage(MESSAGES.stockItems)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <ItemsFilters params={params} />
                <Table
                    expanded={{}}
                    getObjectId={obj => obj.id}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'sku', desc: false }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};

const StockItemDetails: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: stockItem, isFetching: isFetchingStockItem } =
        useGetStockItem(params.id as number);
    const { data, isFetching } = useGetStockLedgerItemsPaginated(
        params,
        stockItem,
    );
    const redirectTo = useRedirectTo();
    const columns = useDetailsColumns();
    return (
        <>
            {(isFetchingStockItem || isFetching) && <LoadingSpinner />}
            <TopBar
                title={
                    stockItem == null
                        ? formatMessage(MESSAGES.stockItem)
                        : `${stockItem.org_unit.name} - ${stockItem.sku.name}: ${stockItem.value}`
                }
                displayBackButton={true}
                goBack={() => redirectTo(baseUrl)}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <DetailsFilters params={params} />
                <Table
                    expanded={{}}
                    getObjectId={obj => obj.id}
                    data={data?.results ?? []}
                    pages={data?.pages ?? 1}
                    defaultSorted={[{ id: 'created_at', desc: true }]}
                    columns={columns}
                    count={data?.count ?? 0}
                    baseUrl={baseUrl}
                    params={params}
                    onTableParamsChange={p => redirectTo(baseUrl, p)}
                />
            </Box>
        </>
    );
};
