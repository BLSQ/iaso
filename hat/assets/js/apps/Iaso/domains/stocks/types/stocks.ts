import { Pagination } from 'bluesquare-components';
import { PaginationParams } from '../../../types/general';

export type StockMovement = {
    id: number;
    stock_item: number;
    org_unit: number;
    quantity: number;
    creation_date: string;
};

export type StockItem = {
    id: number;
    name: string;
};

export type StockMovements = StockMovement[];
export interface StocksMovementPaginated extends Pagination {
    results: StockMovements;
}

export interface StockItems extends Pagination {
    results: StockItem[];
}

export type StocksParams = PaginationParams & {
    accountId?: 'string';
    orgUnitId?: 'string';
    stockItem?: 'string';
};
