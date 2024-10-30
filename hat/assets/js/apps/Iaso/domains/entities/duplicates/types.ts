import { FormDescriptor } from '../../forms/types/forms';

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
    type: 'namesim' | 'inverse' | 'levenshtein';
    the_fields: string[];
    similarity: number;
    similarity_star: number;
};

export type DuplicateData = {
    entity_type: { id: number; name: string };
    form: { id: number; name: string };
    the_fields: {
        field: string;
        label: string | Record<string, string>;
    }[];
    entity1: DuplicateEntity;
    entity2: DuplicateEntity;
    analyzis: DuplicationAlgorithm[];
    ignored: boolean;
    ignored_reason?: string;
    merged: boolean;
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

export type DuplicateDetailData = {
    fields: DuplicateEntityForTable[];
    descriptor1: FormDescriptor;
    descriptor2: FormDescriptor;
};

export type Analysis = {
    id: number;
    algorithm: string;
    created_at?: string; // DateTime
    finished_at?: string; // DateTime
    metadata: {
        fields: string[];
        parameters: Record<string, string>;
        entity_type_id: string;
    };
    task: number;
};

export type Parameters = { name: string; value: string | number }[];
