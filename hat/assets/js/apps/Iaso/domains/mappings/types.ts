// mapping versions come from the untyped /api/mappingversions/ serializer
export type MappingVersionRow = Record<string, any>;

// See importMappings.ts for the shapes a question mapping can take
export type QuestionMapping = Record<string, any> | Record<string, any>[];
export type QuestionMappings = Record<string, QuestionMapping>;

export type DiffKind = 'conflict' | 'add' | 'identical' | 'dropped';
export type Decision = 'keep' | 'overwrite' | 'apply' | 'skip';

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
    // payload restoring the state before the import
    undo: Record<string, QuestionMapping | { action: 'unmap' }>;
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

export type BulkUpdateVariables = {
    mappingVersionId: number;
    questionMappings: Record<string, unknown>;
};
