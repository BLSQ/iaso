import { Pagination } from 'bluesquare-components';
import { EntityType } from './entityType';

export interface PaginatedEntityTypes extends Pagination {
    types: Array<EntityType>;
}
