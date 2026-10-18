// mapping versions come from the untyped /api/mappingversions/ serializer
export type MappingVersionRow = Record<string, any>;

// See importMappings.ts for the shapes a question mapping can take
export type QuestionMapping = Record<string, any> | Record<string, any>[];
export type QuestionMappings = Record<string, QuestionMapping>;

export enum DiffKind {
    CONFLICT = 'conflict',
    ADD = 'add',
    IDENTICAL = 'identical',
    DROPPED = 'dropped',
}

export enum Decision {
    KEEP = 'keep',
    OVERWRITE = 'overwrite',
    APPLY = 'apply',
    SKIP = 'skip',
}

// why an uploaded file can't be imported
export enum MappingImportErrorReason {
    INVALID_JSON = 'invalidJson',
    INVALID_FORMAT = 'invalidFormat',
    MAPPING_TYPE_MISMATCH = 'mappingTypeMismatch',
    NO_VALID_MAPPING = 'noValidMapping',
}

export type DiffRow = {
    kind: DiffKind;
    questionKey: string;
    questionLabel?: string;
    // a mapping or a never mapped marker
    current?: QuestionMapping;
    incoming: QuestionMapping;
    // dropped because its shape does not fit the mapping type
    invalid?: boolean;
};

export type ImportPlan = {
    // payload for PATCH question_mappings
    changes: QuestionMappings;
    added: number;
    overwritten: number;
    kept: number;
    skipped: number;
    dropped: number;
};

export type MappingExport = {
    format: string;
    format_version: number;
    exported_at: string;
    mapping_type: string;
    data_source: { id: number; name: string };
    form: { id: number; name: string };
    form_version: { id: number; version_id: string };
    dataset?: { id?: string; name?: string };
    program?: { id?: string; name?: string };
    question_mappings: QuestionMappings;
};

// a mapping version, or an uploaded export, the wizard can import from
export type ImportSource = {
    id: string;
    title: string;
    meta: string;
    mappingsCount: number;
    matchingCount: number;
    questionMappings: QuestionMappings;
};

// useApplyUpdate: PATCH of mapping version settings, e.g. event_date_source
export type ApplyUpdateVariables = {
    mappingVersionId: number;
    payload: Record<string, unknown>;
};

// useApplyPartialUpdate: the mapping of one question, or an unmap / never map action
export type ApplyPartialUpdateVariables = {
    mappingVersionId: number;
    questionName: string;
    mapping: QuestionMapping;
};

export type BulkUpdateVariables = {
    mappingVersionId: number;
    questionMappings: Record<string, unknown>;
};

export enum QuestionStatus {
    MAPPED = 'mapped',
    UNMAPPED = 'unmapped',
    NEVER = 'never',
}

export type QuestionTreeNode = {
    key: string;
    name: string;
    label: string;
    type: string;
    // the descriptor node
    question: Record<string, any>;
    selectable: boolean;
    status: QuestionStatus;
    // label of the DHIS2 target when mapped
    target?: string;
    // questions (leaves) below a group and how many of them are mapped
    mappedCount: number;
    questionsCount: number;
    children?: QuestionTreeNode[];
};
