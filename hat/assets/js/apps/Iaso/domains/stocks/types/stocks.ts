import { Pagination } from 'bluesquare-components';
import { PaginationParams } from '../../../types/general';

export type StocksParams = PaginationParams & {
    accountId: 'string';
    orgUnitId: 'string';
    stockItem: 'string';
};

export type StockMovement = {
    id: number;
    stock_item: number;
    org_unit: number;
    quantity: number;
    creation_date: string;
};

export type StockMouvements = Array<StockMovement>;
export interface StocksMovementPaginated extends Pagination {
    results: StockMouvements;
}

export type StockItem = {
    id: number;
    name: string;
};

export type StockItems = {
    results: Array<StockItem>;
};
