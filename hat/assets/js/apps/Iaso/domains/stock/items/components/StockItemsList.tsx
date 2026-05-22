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
import { ItemsFilters } from 'Iaso/domains/stock/items/components/Filters';
import { baseUrl, useColumns } from 'Iaso/domains/stock/items/config';
import { useGetStockItemsPaginated } from 'Iaso/domains/stock/items/hooks/requests';
import { Params } from 'Iaso/domains/stock/items/types/filters';
import MESSAGES from 'Iaso/domains/stock/messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export type Props = {
    params: Params;
};

export const StockItemsList: FunctionComponent<Props> = ({ params }) => {
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
