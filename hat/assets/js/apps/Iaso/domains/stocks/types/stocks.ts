import { Pagination } from 'bluesquare-components';

export type StocksParams = {
    accountId: 'string';
    orgUnitId: 'string';
    item: 'string';
};

export type StockMouvement = {
    id: number;
    stock_item: number;
    org_unit: number;
    quantity: number;
    creation_date: string;
};

export type StockMouvements = Array<StockMouvement>;
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
