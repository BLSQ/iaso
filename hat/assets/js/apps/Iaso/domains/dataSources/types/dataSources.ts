import { OrgUnitStatus } from '../../orgUnits/types/orgUnit';

export type Project = {
    name: string;
};

export type Credentials = {
    name: string;
    url: string;
};

export type Version = {
    number: number;
    description: string;
    id: number;
    created_at: string;
    updated_at: string;
    org_units_count: number;
    data_source_name: string;
    data_source: number;
    tree_config_status_fields: OrgUnitStatus[];
    is_default: boolean;
};

export type DataSource = {
    id: number;
    name: string;
    read_only: boolean;
    description: string;
    versions: Version[];
    url: string;
    projects: Project[];
    default_version: Version;
    credentials: Credentials;
    tree_config_status_fields: OrgUnitStatus[];
};
