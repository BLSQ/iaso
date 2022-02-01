import { Entity } from './entity';

export type PaginatedEntities = {
    entities: Array<Entity>;
    pages: number;
    page: number;
    count: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
};
