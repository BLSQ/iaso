// Matches swagger `iaso_group_serializer` (GET/POST /api/groups/)

export type GroupDataSource = {
    id: number;
    name: string;
};

export type GroupSourceVersion = {
    id: number;
    number: number;
    data_source: GroupDataSource;
};

export type NestedGroupInGroupSet = {
    id: number;
    name: string;
    created_at: number;
    updated_at: number;
    source_version: GroupSourceVersion;
};

export type GroupSet = {
    id: number;
    name: string;
    group_belonging: 'SINGLE' | string;
    source_version: GroupSourceVersion;
    source_ref: string | null;
    groups: NestedGroupInGroupSet[];
    group_ids: number[];
    created_at: number;
    updated_at: number;
};

export type Group = {
    id: number;
    name: string;
    source_ref: string | null;
    source_version: GroupSourceVersion;
    group_sets: GroupSet[];
    org_unit_count: number;
    // SerializerMethodField returns org unit ids; swagger may show string
    org_units: number[];
    created_at: number;
    updated_at: number;
    block_of_countries: boolean;
};
