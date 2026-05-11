import { PaginationType } from 'bluesquare-components';
import { Project } from './project';

export interface PaginatedProjects extends PaginationType {
    projects: Array<Project>;
}
