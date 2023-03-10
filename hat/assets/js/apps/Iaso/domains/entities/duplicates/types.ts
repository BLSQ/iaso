/* eslint-disable camelcase */
export type DuplicateEntity = {
    id: number;
    created_at: string; // DateTime
    updated_at: string; // DateTime
    // entity_type: { id: number; name: string };
    // form: { id: number; name: string };
    org_unit: { id: number; name: string };
    json: Record<string, any>;
};

export type DuplicationAlgorithm = {
    analyze_id: string;
    type: 'namesim' | 'invert';
    fields: string[];
    similarity: number;
    similarity_star: number;
};

export type DuplicateData = {
    entity_type: { id: number; name: string };
    form: { id: number; name: string };
    fields: {
        field: string;
        label: string | Record<string, string>;
    }[];
    entity1: DuplicateEntity;
    entity2: DuplicateEntity;
    algorithms: DuplicationAlgorithm[];
    ignored: boolean;
    ignored_reason?: string;
    similarity: number;
    similarity_star: number;
};
export type DuplicatesList = {
    count: number;
    has_previous: boolean;
    has_next: boolean;
    page: number;
    pages: number;
    limit: number;
    results: DuplicateData[];
};

export type EntityForTableData = {
    id?: number;
    value?: string;
    status: 'identical' | 'diff' | 'dropped' | 'selected';
};

export type DuplicateEntityForTable = {
    field: {
        field: string;
        label: string | Record<string, string>;
    };
    entity1: EntityForTableData;
    entity2: EntityForTableData;
    final: EntityForTableData;
};
