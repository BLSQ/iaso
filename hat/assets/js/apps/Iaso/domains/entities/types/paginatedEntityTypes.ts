import { Entity } from './entity';

export type PaginatedEntityTypes = {
    types: Array<Entity>;
    pages: number;
    page: number;
    count: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
};
