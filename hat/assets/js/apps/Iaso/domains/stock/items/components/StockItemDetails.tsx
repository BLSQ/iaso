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
import { DetailsFilters } from 'Iaso/domains/stock/items/components/Filters';
import { baseUrl, useDetailsColumns } from 'Iaso/domains/stock/items/config';
import {
    useGetStockItem,
    useGetStockLedgerItemsPaginated,
} from 'Iaso/domains/stock/items/hooks/requests';
import { Params } from 'Iaso/domains/stock/items/types/filters';
import MESSAGES from 'Iaso/domains/stock/messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export type Props = {
    params: Params;
};

export const StockItemDetails: FunctionComponent<Props> = ({ params }) => {
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
