import React, { FunctionComponent } from 'react';
import { StockItemDetails } from 'Iaso/domains/stock/items/components/StockItemDetails';
import { StockItemsList } from 'Iaso/domains/stock/items/components/StockItemsList';
import { Params } from 'Iaso/domains/stock/items/types/filters';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { baseUrl } from './config';

export const StockItems: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as unknown as Params;
    return (
        <>
            {!params.id && <StockItemsList params={params} />}
            {params.id && <StockItemDetails params={params} />}
        </>
    );
};
