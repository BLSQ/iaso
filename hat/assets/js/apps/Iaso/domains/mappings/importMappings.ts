import { isEqual } from 'lodash';
import Descriptor from './descriptor';
import { isNeverMapped } from './question_mappings';
import {
    Decision,
    DiffKind,
    DiffRow,
    ImportPlan,
    MappingExport,
    QuestionMapping,
    QuestionMappings,
} from './types';

export const DIFF_KINDS: DiffKind[] = [
    'conflict',
    'add',
    'identical',
    'dropped',
];

export const EXPORT_FORMAT = 'iaso-mapping-export';
export const EXPORT_FORMAT_VERSION = 1;

/*
 * question_mappings values come in several shapes:
 *  - AGGREGATE / EVENT data element: { id, valueType, categoryOptionCombo, ... }
 *  - select all that apply as a whole: { type: 'multiple', values: { choice: { id, ... } } }
 *    or one boolean data element per choice, keyed `question__choice`
 *  - EVENT_TRACKER: a list [{ dataElement | trackedEntityAttribute, programStage, iaso_field, parent }]
 *  - EVENT_TRACKER repeat group: [{ type: 'repeat', program_id, relationship_type, tracked_entity_identifier, ... }]
 *  - never mapped marker: { type: 'neverMapped' }
 */

// Same rule as the backend copy_mappings_from_previous_version: everything
// but survey and plain groups can carry a mapping (repeat groups and select
// all that apply questions included).
const NOT_MAPPABLE_TYPES = ['survey', 'group'];

/**
 * Questions of a form version that can be mapped, indexed by the key used in
 * question_mappings.
 */
export const getMappableQuestions = (
    descriptor: Record<string, any> | undefined,
): Record<string, any> => {
    const result: Record<string, any> = {};
    Object.values(Descriptor.indexQuestions(descriptor)).forEach(
        (question: any) => {
            if (!NOT_MAPPABLE_TYPES.includes(question.type)) {
                result[Descriptor.getKey(question)] = question;
            }
        },
    );
    return result;
};

/** A mapping pointing to something in DHIS2 (not a never mapped marker). */
export const hasTarget = (mapping?: QuestionMapping): boolean => {
    if (!mapping || isNeverMapped(mapping)) {
        return false;
    }
    return Array.isArray(mapping) ? mapping.length > 0 : true;
};

/** Mappings that carry a target, i.e. no "never mapped" markers. */
export const getImportableMappings = (
    questionMappings: QuestionMappings | undefined,
): QuestionMappings => {
    const result: QuestionMappings = {};
    Object.entries(questionMappings ?? {}).forEach(([key, mapping]) => {
        if (hasTarget(mapping)) {
            result[key] = mapping;
        }
    });
    return result;
};

const mappingItemLabel = (mapping: Record<string, any>): string => {
    if (mapping.type === 'multiple') {
        return Object.entries(mapping.values ?? {})
            .map(
                ([choice, target]: [string, any]) =>
                    `${choice}: ${mappingItemLabel(target)}`,
            )
            .join(', ');
    }
    if (mapping.type === 'repeat') {
        const program = mapping.program_name ?? mapping.program_id;
        return mapping.relationship_type_name
            ? `${program} (${mapping.relationship_type_name})`
            : program;
    }
    const name =
        mapping.displayName ??
        mapping.name ??
        mapping.dataElement?.name ??
        mapping.trackedEntityAttribute?.name ??
        mapping.id ??
        '';
    const comboName = mapping.categoryOptionComboName;
    return comboName && comboName !== 'default' && !name.includes(comboName)
        ? `${name} (${comboName})`
        : name;
};

export const getMappingLabel = (mapping?: QuestionMapping): string => {
    if (!mapping) {
        return '';
    }
    if (Array.isArray(mapping)) {
        return mapping.map(mappingItemLabel).join(', ');
    }
    return mappingItemLabel(mapping);
};

// Fields identifying the DHIS2 target of a mapping, ignoring the cached
// metadata (names, option sets, datasets, ...).
const mappingTargetKey = (
    mapping: Record<string, any>,
): Record<string, unknown> => ({
    type: mapping.type,
    id: mapping.id,
    categoryOptionCombo: mapping.categoryOptionCombo,
    dataElement: mapping.dataElement?.id,
    trackedEntityAttribute: mapping.trackedEntityAttribute?.id,
    programStage: mapping.programStage,
    iaso_field: mapping.iaso_field,
    parent: mapping.parent,
    program_id: mapping.program_id,
    tracked_entity_type: mapping.tracked_entity_type,
    tracked_entity_identifier: mapping.tracked_entity_identifier,
    relationship_type: mapping.relationship_type,
    values: mapping.values
        ? Object.fromEntries(
              Object.entries(mapping.values).map(
                  ([choice, target]: [string, any]) => [
                      choice,
                      mappingTargetKey(target),
                  ],
              ),
          )
        : undefined,
});

/**
 * Two mappings are identical when they point to the same DHIS2 target, even
 * if the cached metadata (names, datasets, ...) differs.
 */
export const isSameMapping = (a: QuestionMapping, b: QuestionMapping) => {
    if (Array.isArray(a) !== Array.isArray(b)) {
        return false;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return isEqual(a.map(mappingTargetKey), b.map(mappingTargetKey));
    }
    return isEqual(
        mappingTargetKey(a as Record<string, any>),
        mappingTargetKey(b as Record<string, any>),
    );
};

const isObject = (value: unknown): value is Record<string, any> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isTrackerItem = (item: unknown): boolean =>
    isObject(item) &&
    Boolean(
        item.dataElement?.id ||
        item.trackedEntityAttribute?.id ||
        (item.type === 'repeat' && item.program_id),
    );

/**
 * Whether a question mapping has the shape the exporter of the mapping type
 * reads. Same rules as get_question_mapping_shape_error on the backend.
 */
export const isValidForMappingType = (
    mapping: QuestionMapping,
    mappingType: string,
): boolean => {
    if (isNeverMapped(mapping)) {
        return true;
    }
    if (mappingType === 'EVENT_TRACKER') {
        return (
            Array.isArray(mapping) &&
            mapping.length > 0 &&
            mapping.every(isTrackerItem)
        );
    }
    if (Array.isArray(mapping) || !isObject(mapping)) {
        return false;
    }
    const { type, values, id, valueType } = mapping;
    if (type === 'multiple') {
        return (
            isObject(values) &&
            Object.values(values).every(
                value => isObject(value) && Boolean(value.id),
            )
        );
    }
    return Boolean(id && valueType);
};

export const computeMappingsDiff = (
    currentMappings: QuestionMappings,
    incomingMappings: QuestionMappings,
    questions: Record<string, any>,
    mappingType: string,
): DiffRow[] =>
    Object.entries(getImportableMappings(incomingMappings)).map(
        ([questionKey, incoming]) => {
            const question = questions[questionKey];
            const current = currentMappings[questionKey];
            const row: DiffRow = {
                kind: 'add',
                questionKey,
                questionLabel: question
                    ? Descriptor.getHumanLabel(question)
                    : undefined,
                // a never mapped marker is a decision too: overwriting it is a conflict
                current:
                    hasTarget(current) || isNeverMapped(current)
                        ? current
                        : undefined,
                incoming,
            };
            if (!question) {
                row.kind = 'dropped';
            } else if (!isValidForMappingType(incoming, mappingType)) {
                row.kind = 'dropped';
                row.invalid = true;
            } else if (row.current) {
                row.kind = isSameMapping(row.current, incoming)
                    ? 'identical'
                    : 'conflict';
            }
            return row;
        },
    );

/** Mappings of a question of this version, valid for the mapping type. */
export const countMatchingMappings = (
    questionMappings: QuestionMappings,
    questions: Record<string, any>,
    mappingType: string,
): number =>
    Object.entries(questionMappings).filter(
        ([key, mapping]) =>
            questions[key] && isValidForMappingType(mapping, mappingType),
    ).length;

export const countValidMappings = (
    questionMappings: QuestionMappings,
    mappingType: string,
): number =>
    Object.values(questionMappings).filter(mapping =>
        isValidForMappingType(mapping, mappingType),
    ).length;

export const getDefaultDecision = (
    row: DiffRow,
    overwriteConflicts = false,
): Decision | undefined => {
    if (row.kind === 'conflict') {
        return overwriteConflicts ? 'overwrite' : 'keep';
    }
    if (row.kind === 'add') {
        return 'apply';
    }
    return undefined;
};

export const willApply = (decision?: Decision) =>
    decision === 'apply' || decision === 'overwrite';

export const buildImportPlan = (
    rows: DiffRow[],
    decisions: Record<string, Decision | undefined>,
): ImportPlan => {
    const plan: ImportPlan = {
        changes: {},
        added: 0,
        overwritten: 0,
        kept: 0,
        skipped: 0,
        dropped: 0,
    };
    rows.forEach(row => {
        const decision = decisions[row.questionKey];
        if (row.kind === 'dropped') {
            plan.dropped += 1;
        } else if (row.kind === 'conflict' && decision === 'overwrite') {
            plan.changes[row.questionKey] = row.incoming;
            plan.overwritten += 1;
        } else if (row.kind === 'conflict') {
            plan.kept += 1;
        } else if (row.kind === 'add' && decision === 'apply') {
            plan.changes[row.questionKey] = row.incoming;
            plan.added += 1;
        } else if (row.kind === 'add') {
            plan.skipped += 1;
        }
    });
    return plan;
};

export const buildMappingExport = (
    mappingVersion: Record<string, any>,
    now: Date = new Date(),
): MappingExport => {
    const { mapping, form_version: formVersion } = mappingVersion;
    const settings = mappingVersion.derivate_settings ?? {};
    const result: MappingExport = {
        format: EXPORT_FORMAT,
        format_version: EXPORT_FORMAT_VERSION,
        exported_at: now.toISOString(),
        mapping_type: mapping.mapping_type,
        data_source: mapping.data_source,
        form: { id: formVersion.form.id, name: formVersion.form.name },
        form_version: {
            id: formVersion.id,
            version_id: formVersion.version_id,
        },
        question_mappings: getImportableMappings(
            mappingVersion.question_mappings,
        ),
    };
    if (settings.data_set_id) {
        result.dataset = {
            id: settings.data_set_id,
            name: settings.data_set_name,
        };
    }
    if (settings.program_id) {
        result.program = {
            id: settings.program_id,
            name: settings.program_name,
        };
    }
    return result;
};

export const getExportFileName = (mappingVersion: Record<string, any>) => {
    const { form_version: formVersion, mapping } = mappingVersion;
    const slug =
        `${formVersion.form.name}-${formVersion.version_id}-${mapping.mapping_type}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    return `mapping-${slug}.json`;
};

const isValidMapping = (mapping: unknown): boolean =>
    Array.isArray(mapping) ? mapping.every(isObject) : isObject(mapping);

export class MappingImportError extends Error {
    constructor(
        public reason:
            | 'invalidJson'
            | 'invalidFormat'
            | 'mappingTypeMismatch'
            | 'noValidMapping',
    ) {
        super(reason);
    }
}

/**
 * Accepts an export produced by buildMappingExport, or a bare
 * question_mappings dictionary.
 */
export const parseMappingExport = (
    text: string,
    expectedMappingType: string,
): Partial<MappingExport> & { question_mappings: QuestionMappings } => {
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new MappingImportError('invalidJson');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new MappingImportError('invalidFormat');
    }
    const content =
        'question_mappings' in parsed ? parsed : { question_mappings: parsed };
    const { question_mappings: questionMappings } = content;
    if (
        !questionMappings ||
        typeof questionMappings !== 'object' ||
        Array.isArray(questionMappings) ||
        Object.values(questionMappings).some(m => !isValidMapping(m))
    ) {
        throw new MappingImportError('invalidFormat');
    }
    if (content.mapping_type && content.mapping_type !== expectedMappingType) {
        throw new MappingImportError('mappingTypeMismatch');
    }
    if (
        countValidMappings(
            getImportableMappings(questionMappings),
            expectedMappingType,
        ) === 0
    ) {
        throw new MappingImportError('noValidMapping');
    }
    return content;
};

/**
 * The DHIS2 dataset or program an export was made for, when it is not the
 * one of the mapping version it is imported in.
 */
export const getOtherTarget = (
    content: Partial<MappingExport>,
    mappingVersion: Record<string, any>,
): { kind: 'dataset' | 'program'; name: string } | undefined => {
    const settings = mappingVersion.derivate_settings ?? {};
    if (
        content.dataset?.id &&
        settings.data_set_id &&
        content.dataset.id !== settings.data_set_id
    ) {
        return {
            kind: 'dataset',
            name: content.dataset.name ?? content.dataset.id,
        };
    }
    if (
        content.program?.id &&
        settings.program_id &&
        content.program.id !== settings.program_id
    ) {
        return {
            kind: 'program',
            name: content.program.name ?? content.program.id,
        };
    }
    return undefined;
};
