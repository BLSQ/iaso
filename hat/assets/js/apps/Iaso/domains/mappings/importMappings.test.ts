import { describe, expect, it } from 'vitest';
import {
    buildImportPlan,
    buildMappingExport,
    computeMappingsDiff,
    getDefaultDecision,
    getExportFileName,
    getMappableQuestions,
    getMappingLabel,
    getOtherTarget,
    isValidForMappingType,
    MappingImportError,
    parseMappingExport,
} from './importMappings';

const descriptor = {
    name: 'survey',
    type: 'survey',
    children: [
        {
            name: 'grp1',
            type: 'group',
            label: 'Group 1',
            children: [
                { name: 'q1', type: 'integer', label: 'Question 1' },
                { name: 'q2', type: 'integer', label: 'Question 2' },
            ],
        },
        { name: 'q3', type: 'integer', label: 'Question 3' },
        { name: 'q4', type: 'integer', label: 'Question 4' },
        { name: 'q5', type: 'integer', label: 'Question 5' },
    ],
};

const de = (id: string, extra = {}) => ({
    id,
    name: `DE ${id}`,
    valueType: 'NUMBER',
    categoryOptionCombo: 'coc1',
    categoryOptionComboName: 'default',
    ...extra,
});

describe('getMappableQuestions', () => {
    it('keeps repeat groups, select all that apply and their choices', () => {
        const questions = getMappableQuestions({
            name: 'survey',
            type: 'survey',
            children: [
                {
                    name: 'household',
                    type: 'repeat',
                    children: [{ name: 'age', type: 'integer' }],
                },
                {
                    name: 'symptoms',
                    type: 'select all that apply',
                    children: [
                        { name: 'fever', label: 'Fever' },
                        { name: 'cough', label: 'Cough' },
                    ],
                },
                {
                    name: 'sex',
                    type: 'select one',
                    children: [{ name: 'male' }],
                },
            ],
        });
        expect(Object.keys(questions).sort()).toEqual([
            'age',
            'household',
            'sex',
            'symptoms',
            'symptoms__cough',
            'symptoms__fever',
        ]);
    });

    it('skips groups', () => {
        expect(Object.keys(getMappableQuestions(descriptor)).sort()).toEqual([
            'q1',
            'q2',
            'q3',
            'q4',
            'q5',
        ]);
    });
});

describe('getMappingLabel', () => {
    it('shows the combo when not default', () => {
        expect(getMappingLabel(de('a'))).toBe('DE a');
        expect(
            getMappingLabel(de('a', { categoryOptionComboName: 'Male' })),
        ).toBe('DE a (Male)');
    });
    it('joins event tracker mappings', () => {
        expect(
            getMappingLabel([
                { dataElement: { id: 'x', name: 'X' } },
                { trackedEntityAttribute: { id: 'y', name: 'Y' } },
            ]),
        ).toBe('X, Y');
    });
});

describe('mapping shapes', () => {
    const multiple = (fever: string) => ({
        type: 'multiple',
        values: { fever: de(fever), cough: de('cough') },
    });
    const tracker = (stage: string) => [
        {
            dataElement: { id: 'de1', name: 'Age' },
            programStage: stage,
            parent: 'household',
        },
    ];
    const repeat = (relationship: string) => [
        {
            type: 'repeat',
            program_id: 'p1',
            program_name: 'Program',
            tracked_entity_type: 'tet',
            tracked_entity_identifier: 'uid',
            relationship_type: relationship,
            relationship_type_name: `Rel ${relationship}`,
        },
    ];
    const questions = {
        symptoms: { name: 'symptoms', type: 'select all that apply' },
        age: { name: 'age', type: 'integer' },
        household: { name: 'household', type: 'repeat' },
        empty: { name: 'empty', type: 'integer' },
    };

    const kindsOf = (rows: { questionKey: string; kind: string }[]) =>
        Object.fromEntries(rows.map(r => [r.questionKey, r.kind]));

    it('compares each shape on its DHIS2 target', () => {
        expect(
            kindsOf(
                computeMappingsDiff(
                    { symptoms: multiple('a'), empty: [] },
                    { symptoms: multiple('b'), empty: de('x') },
                    questions,
                    'AGGREGATE',
                ),
            ),
        ).toEqual({
            // a "multiple" mapping has no id but is a real mapping
            symptoms: 'conflict',
            // an empty list is not a mapping
            empty: 'add',
        });
        expect(
            kindsOf(
                computeMappingsDiff(
                    { age: tracker('s1'), household: repeat('r1') },
                    {
                        age: [
                            { ...tracker('s1')[0], dataElement: { id: 'de1' } },
                        ],
                        household: repeat('r2'),
                    },
                    questions,
                    'EVENT_TRACKER',
                ),
            ),
        ).toEqual({ age: 'identical', household: 'conflict' });
        expect(
            computeMappingsDiff(
                { age: tracker('s1') },
                { age: tracker('s2') },
                questions,
                'EVENT_TRACKER',
            )[0].kind,
        ).toBe('conflict');
    });

    it.each([
        ['a data element', de('a'), 'AGGREGATE', true],
        ['a data element without valueType', { id: 'a' }, 'AGGREGATE', false],
        ['a select all that apply', multiple('a'), 'EVENT', true],
        [
            'a select all that apply choice without id',
            { type: 'multiple', values: { fever: { name: 'Fever' } } },
            'AGGREGATE',
            false,
        ],
        ['a tracker list', tracker('s1'), 'AGGREGATE', false],
        ['a tracker list', tracker('s1'), 'EVENT_TRACKER', true],
        ['a repeat group', repeat('r1'), 'EVENT_TRACKER', true],
        [
            'a tracked entity attribute',
            [{ trackedEntityAttribute: { id: 'tea' } }],
            'EVENT_TRACKER',
            true,
        ],
        ['a data element', de('a'), 'EVENT_TRACKER', false],
        ['an empty list', [], 'EVENT_TRACKER', false],
        ['a list of junk', [{ foo: 1 }], 'EVENT_TRACKER', false],
        [
            'a never mapped marker',
            { type: 'neverMapped' },
            'EVENT_TRACKER',
            true,
        ],
    ])('%s in a %s mapping is valid: %s', (_, mapping, mappingType, valid) => {
        expect(isValidForMappingType(mapping as any, mappingType)).toBe(valid);
    });

    it('drops mappings that do not fit the mapping type', () => {
        const rows = computeMappingsDiff(
            {},
            { symptoms: tracker('s1'), age: de('a') },
            questions,
            'AGGREGATE',
        );
        expect(kindsOf(rows)).toEqual({ symptoms: 'dropped', age: 'add' });
        expect(rows.find(r => r.questionKey === 'symptoms')?.invalid).toBe(
            true,
        );
    });

    it('labels each shape', () => {
        expect(getMappingLabel(multiple('a'))).toBe(
            'fever: DE a, cough: DE cough',
        );
        expect(getMappingLabel(repeat('r1'))).toBe('Program (Rel r1)');
        expect(getMappingLabel(tracker('s1'))).toBe('Age');
        expect(
            getMappingLabel(
                de('a', {
                    displayName: 'DE a - Male',
                    categoryOptionComboName: 'Male',
                }),
            ),
        ).toBe('DE a - Male');
    });
});

describe('computeMappingsDiff', () => {
    const current = {
        q1: de('a'),
        q2: de('b'),
        q4: { type: 'neverMapped' },
    };
    const incoming = {
        q1: de('a', { name: 'renamed' }),
        q2: de('c'),
        q3: de('d'),
        q4: de('e'),
        q5: { type: 'neverMapped' },
        gone: de('f'),
    };
    const rows = computeMappingsDiff(
        current,
        incoming,
        getMappableQuestions(descriptor),
        'AGGREGATE',
    );
    const kinds = Object.fromEntries(rows.map(r => [r.questionKey, r.kind]));

    it('classifies each incoming mapping', () => {
        expect(kinds).toEqual({
            q1: 'identical',
            q2: 'conflict',
            q3: 'add',
            // overwriting a never mapped marker is a decision to take
            q4: 'conflict',
            gone: 'dropped',
        });
    });

    it('only imports choice keys of select all that apply questions', () => {
        const choiceQuestions = getMappableQuestions({
            name: 'survey',
            type: 'survey',
            children: [
                {
                    name: 'symptoms',
                    type: 'select all that apply',
                    children: [{ name: 'fever' }],
                },
                {
                    name: 'sex',
                    type: 'select one',
                    children: [{ name: 'male' }],
                },
            ],
        });
        const choiceRows = computeMappingsDiff(
            {},
            { symptoms__fever: de('a'), sex__male: de('b') },
            choiceQuestions,
            'AGGREGATE',
        );
        expect(
            Object.fromEntries(choiceRows.map(r => [r.questionKey, r.kind])),
        ).toEqual({ symptoms__fever: 'add', sex__male: 'dropped' });
    });

    it('builds the patch and undo payloads', () => {
        const decisions = Object.fromEntries(
            rows.map(r => [r.questionKey, getDefaultDecision(r, true)]),
        );
        const plan = buildImportPlan(rows, decisions);
        expect(plan.changes).toEqual({
            q2: de('c'),
            q3: de('d'),
            q4: de('e'),
        });
        expect(plan.undo).toEqual({
            q2: de('b'),
            q3: { action: 'unmap' },
            // undo puts the never mapped marker back
            q4: { type: 'neverMapped' },
        });
        expect(plan).toMatchObject({
            added: 1,
            overwritten: 2,
            kept: 0,
            skipped: 0,
            dropped: 1,
        });
    });

    it('keeps current mappings by default', () => {
        const decisions = Object.fromEntries(
            rows.map(r => [r.questionKey, getDefaultDecision(r)]),
        );
        const plan = buildImportPlan(rows, decisions);
        expect(Object.keys(plan.changes)).toEqual(['q3']);
        expect(plan.kept).toBe(2);
    });
});

describe('export / import', () => {
    const mappingVersion = {
        id: 1,
        form_version: {
            id: 10,
            version_id: '2021111101',
            form: { id: 5, name: "Cadre de l'ECZS" },
        },
        mapping: {
            mapping_type: 'AGGREGATE',
            data_source: { id: 3, name: 'dhis2' },
        },
        question_mappings: { q1: de('a'), q2: { type: 'neverMapped' } },
        derivate_settings: { data_set_id: 'ds1', data_set_name: 'DS 1' },
    };

    it('exports without never mapped markers', () => {
        const exported = buildMappingExport(
            mappingVersion,
            new Date('2026-01-01T00:00:00Z'),
        );
        expect(exported.question_mappings).toEqual({ q1: de('a') });
        expect(exported.dataset).toEqual({ id: 'ds1', name: 'DS 1' });
        expect(exported.program).toBeUndefined();
        expect(getExportFileName(mappingVersion)).toBe(
            'mapping-cadre-de-l-eczs-2021111101-aggregate.json',
        );
    });

    it('round trips', () => {
        const text = JSON.stringify(buildMappingExport(mappingVersion));
        expect(parseMappingExport(text, 'AGGREGATE').question_mappings).toEqual(
            { q1: de('a') },
        );
    });

    it('accepts a bare question_mappings dictionary', () => {
        expect(
            parseMappingExport(JSON.stringify({ q1: de('a') }), 'AGGREGATE')
                .question_mappings,
        ).toEqual({ q1: de('a') });
    });

    it.each([
        ['not json', 'invalidJson'],
        ['[]', 'invalidFormat'],
        ['{"q1": 3}', 'invalidFormat'],
        ['{"q1": [3]}', 'invalidFormat'],
        [
            '{"mapping_type": "EVENT", "question_mappings": {}}',
            'mappingTypeMismatch',
        ],
        // any JSON object whose values are objects, e.g. a tsconfig.json
        ['{"compilerOptions": {"strict": true}}', 'noValidMapping'],
        ['{"q1": [{"dataElement": {"id": "x"}}]}', 'noValidMapping'],
        ['{"question_mappings": {}}', 'noValidMapping'],
    ])('rejects %s', (text, reason) => {
        // the error message is the reason
        expect(() => parseMappingExport(text, 'AGGREGATE')).toThrow(
            new MappingImportError(reason as any),
        );
    });
});

describe('getOtherTarget', () => {
    const aggregate = { derivate_settings: { data_set_id: 'ds1' } };
    const tracker = { derivate_settings: { program_id: 'p1' } };

    it('flags an export made for another dataset or program', () => {
        expect(
            getOtherTarget({ dataset: { id: 'ds2', name: 'DS 2' } }, aggregate),
        ).toEqual({ kind: 'dataset', name: 'DS 2' });
        expect(getOtherTarget({ program: { id: 'p2' } }, tracker)).toEqual({
            kind: 'program',
            name: 'p2',
        });
    });

    it('accepts the same target, or an export without one', () => {
        expect(getOtherTarget({ dataset: { id: 'ds1' } }, aggregate)).toBe(
            undefined,
        );
        expect(getOtherTarget({}, aggregate)).toBe(undefined);
    });
});
