import { Pagination } from 'bluesquare-components';
import { User } from 'Iaso/utils/usersUtils';
import { OrgUnit } from '../orgUnits/types/orgUnit';

export type Algorithm = {
    name: string;
    id: number;
    description: string;
};
type Destination = {
    name: string;
    id: number;
    description: string;
};
type Source = {
    name: string;
    id: number;
    description: string;
};

export type AlgorithmRun = {
    algorithm: Algorithm;
    id: number;
    created_at: number;
    ended_at: number;
    result: Record<string, any> | null;
    finished: boolean;
    launcher: User;
    destination: Destination;
    source: Source;
    links_count: number;
};

export type Link = {
    destination: OrgUnit;
    source: OrgUnit;
    id: number;
    created_at: number;
    updated_at: number;
    validated: boolean;
    validator?: User;
    validation_date: string;
    similarity_score: number;
    algorithm_run: AlgorithmRun;
};

export type PaginatedLinks = Pagination & {
    links: Link[];
};
