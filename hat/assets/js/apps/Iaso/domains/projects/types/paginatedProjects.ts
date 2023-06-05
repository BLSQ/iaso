import { Pagination } from 'bluesquare-components';
import { Project } from './project';

export interface PaginatedProjects extends Pagination {
    projects: Array<Project>;
}
