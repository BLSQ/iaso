import { Project } from './project';
import { Pagination } from '../../../types/table';

export interface PaginatedProjects extends Pagination {
    projects: Array<Project>;
}
