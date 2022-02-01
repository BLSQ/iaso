import { EntityType } from './entityType';

export type PaginatedEntityTypes = {
    types: Array<EntityType>;
    pages: number;
    page: number;
    count: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
};
