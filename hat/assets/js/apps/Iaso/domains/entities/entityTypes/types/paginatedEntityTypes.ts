import { PaginationType } from 'bluesquare-components';
import { EntityType } from './entityType';

export interface PaginatedEntityTypes extends PaginationType {
    types: Array<EntityType>;
}
