import { describe, expect, it } from 'vitest';
import {
    buildImportPlan,
    buildMappingExport,
    computeMappingsDiff,
    getDefaultDecision,
    getExportFileName,
    getMappableQuestions,
    getMappingLabel,
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

    it('compares each shape on its DHIS2 target', () => {
        const rows = computeMappingsDiff(
            {
                symptoms: multiple('a'),
                age: tracker('s1'),
                household: repeat('r1'),
                empty: [],
            },
            {
                symptoms: multiple('b'),
                age: [{ ...tracker('s1')[0], dataElement: { id: 'de1' } }],
                household: repeat('r2'),
                empty: de('x'),
            },
            questions,
        );
        expect(
            Object.fromEntries(rows.map(r => [r.questionKey, r.kind])),
        ).toEqual({
            // a "multiple" mapping has no id but is a real mapping
            symptoms: 'conflict',
            age: 'identical',
            household: 'conflict',
            // an empty list is not a mapping
            empty: 'add',
        });
        expect(
            computeMappingsDiff(
                { age: tracker('s1') },
                { age: tracker('s2') },
                questions,
            )[0].kind,
        ).toBe('conflict');
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
    );
    const kinds = Object.fromEntries(rows.map(r => [r.questionKey, r.kind]));

    it('classifies each incoming mapping', () => {
        expect(kinds).toEqual({
            q1: 'identical',
            q2: 'conflict',
            q3: 'add',
            q4: 'dropped',
            gone: 'dropped',
        });
        expect(rows.find(r => r.questionKey === 'q4')?.neverMapped).toBe(true);
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
        expect(plan.changes).toEqual({ q2: de('c'), q3: de('d') });
        expect(plan.undo).toEqual({ q2: de('b'), q3: { action: 'unmap' } });
        expect(plan).toMatchObject({
            added: 1,
            overwritten: 1,
            kept: 0,
            skipped: 0,
            dropped: 2,
        });
    });

    it('keeps current mappings by default', () => {
        const decisions = Object.fromEntries(
            rows.map(r => [r.questionKey, getDefaultDecision(r)]),
        );
        const plan = buildImportPlan(rows, decisions);
        expect(Object.keys(plan.changes)).toEqual(['q3']);
        expect(plan.kept).toBe(1);
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
    ])('rejects %s', (text, reason) => {
        // the error message is the reason
        expect(() => parseMappingExport(text, 'AGGREGATE')).toThrow(
            new MappingImportError(reason as any),
        );
    });
});
