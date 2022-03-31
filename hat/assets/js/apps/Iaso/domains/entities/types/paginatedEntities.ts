import { Entity } from './entity';
import { Pagination } from '../../../types/table';

export interface PaginatedEntities extends Pagination {
    entities: Array<Entity>;
}
