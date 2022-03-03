import { EntityType } from './entityType';
import { Pagination } from '../../../../types/table';

export interface PaginatedEntityTypes extends Pagination {
    types: Array<EntityType>;
}
