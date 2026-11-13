import { describe, expect, it } from 'vitest';
import Descriptor from './descriptor';

const survey = {
    name: 'survey',
    type: 'survey',
    children: [
        {
            name: 'household',
            type: 'repeat',
            label: 'Household',
            children: [
                { name: 'age', type: 'integer', label: 'Age' },
                { name: 'sex', type: 'select one', label: 'Sex' },
            ],
        },
        {
            name: 'services',
            type: 'select all that apply',
            label: 'Services',
            children: [
                { name: 'water', label: 'Water' },
                { name: 'power', label: 'Power' },
            ],
        },
        {
            name: 'begin',
            type: 'group',
            label: 'Intro',
            children: [{ name: 'q1', type: 'text', label: 'Name' }],
        },
    ],
};

describe('Descriptor.hasChildren', () => {
    it('is true for groups with children', () => {
        expect(
            Descriptor.hasChildren({
                type: 'group',
                children: [{ name: 'a' }],
            }),
        ).toBe(true);
    });

    it('is false for select one even with children', () => {
        expect(
            Descriptor.hasChildren({
                type: 'select one',
                children: [{ name: 'a' }],
            }),
        ).toBe(false);
    });
});

describe('Descriptor.getLabel / getHumanLabel', () => {
    it('returns a plain string label', () => {
        expect(Descriptor.getLabel({ label: 'Hello' })).toBe('Hello');
    });

    it('picks the language key from a translated label', () => {
        expect(
            Descriptor.getLabel(
                { label: { French: 'Bonjour', English: 'Hello' } },
                'English',
            ),
        ).toBe('Hello');
    });

    it('falls back through title, label, hint, name', () => {
        expect(Descriptor.getHumanLabel({ name: 'q1' })).toBe('q1');
        expect(Descriptor.getHumanLabel({ name: 'q1', hint: 'hint' })).toBe(
            'hint',
        );
        expect(Descriptor.getHumanLabel({ name: 'q1', label: 'Label' })).toBe(
            'Label',
        );
        expect(
            Descriptor.getHumanLabel({
                name: 'q1',
                title: 'Title',
                label: 'Label',
            }),
        ).toBe('Title');
    });
});

describe('Descriptor.isGroup', () => {
    it('recognizes survey, group, repeat and select all that apply', () => {
        expect(Descriptor.isGroup({ type: 'survey' })).toBe(true);
        expect(Descriptor.isGroup({ type: 'group' })).toBe(true);
        expect(Descriptor.isGroup({ type: 'repeat' })).toBe(true);
        expect(Descriptor.isGroup({ type: 'select all that apply' })).toBe(
            true,
        );
        expect(Descriptor.isGroup({ type: 'integer' })).toBe(false);
    });
});

describe('Descriptor.getKey / getNodeName', () => {
    it('prefers uuid over name', () => {
        expect(Descriptor.getKey({ uuid: 'u1', name: 'n1' })).toBe('u1');
        expect(Descriptor.getKey({ name: 'n1' })).toBe('n1');
        expect(Descriptor.getKey({})).toBe('');
    });

    it('rewrites begin groups to their label', () => {
        expect(
            Descriptor.getNodeName({
                type: 'group',
                name: 'begin',
                label: 'Intro',
            }),
        ).toBe('Intro');
    });

    it('prefixes select-all choices and sets uuid', () => {
        const choice: { name: string; label: string; uuid?: string } = {
            name: 'water',
            label: 'Water',
        };
        const parent = {
            name: 'services',
            type: 'select all that apply',
        };
        expect(Descriptor.getNodeName(choice, parent)).toBe('services__water');
        expect(choice.uuid).toBe('services__water');
    });
});

describe('Descriptor.indexQuestions', () => {
    it('returns an empty index without children', () => {
        expect(Descriptor.indexQuestions(undefined)).toEqual({});
        expect(Descriptor.indexQuestions({})).toEqual({});
    });

    it('indexes leaves, repeats and select-all choices', () => {
        const indexed = Descriptor.indexQuestions(survey);
        // begin groups are keyed by label; select-all choices as parent__choice
        expect(Object.keys(indexed).sort()).toEqual(
            [
                'Intro',
                'age',
                'household',
                'q1',
                'services',
                'services__power',
                'services__water',
                'sex',
            ].sort(),
        );
        expect(indexed.age.path).toEqual(['survey', 'household', 'age']);
        expect(indexed.services__water.uuid).toBe('services__water');
    });
});

describe('Descriptor.withinRepeatGroup', () => {
    it('returns null without a path', () => {
        expect(Descriptor.withinRepeatGroup({ name: 'q' }, {})).toBeNull();
    });

    it('finds the repeat ancestor name on the path', () => {
        const indexed = Descriptor.indexQuestions(survey);
        expect(Descriptor.withinRepeatGroup(indexed.age, indexed)).toBe(
            'household',
        );
        expect(
            Descriptor.withinRepeatGroup(indexed.q1, indexed),
        ).toBeUndefined();
    });
});

describe('Descriptor.getCoverage', () => {
    it('counts mapped vs total questions under a group', () => {
        const indexed = Descriptor.indexQuestions(survey);
        const mappingVersion = {
            question_mappings: {
                age: { id: 'deAge' },
                services__water: { id: 'deWater' },
            },
        };
        const [mapped, total] = Descriptor.getCoverage(
            indexed,
            mappingVersion,
            survey,
            true,
        );
        expect(total).toBeGreaterThan(0);
        expect(mapped).toBe(2);
        expect(mapped).toBeLessThanOrEqual(total);
    });
});
