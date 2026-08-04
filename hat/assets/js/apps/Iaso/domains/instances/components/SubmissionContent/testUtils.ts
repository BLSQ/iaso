import { SubmissionField } from './types';
import { FilteredSection } from './useSubmissionSections';

/** Minimal field factory for SubmissionContent tests. */
export const makeField = (
    overrides: Partial<SubmissionField> & Pick<SubmissionField, 'kind'>,
): SubmissionField => ({
    id: 'q1',
    label: 'Question',
    value: 'Answer',
    rawValue: 'Answer',
    empty: false,
    descriptor: { name: 'q1', type: 'text' } as SubmissionField['descriptor'],
    ...overrides,
});

export const makeSection = (
    overrides: Partial<FilteredSection> = {},
): FilteredSection => ({
    id: 'group_1',
    label: 'Introduction',
    depth: 0,
    fields: [
        makeField({
            kind: 'text',
            id: 'name',
            label: 'Name',
            value: 'Ada',
            rawValue: 'Ada',
        }),
    ],
    totalFields: 1,
    ...overrides,
});

export const formDescriptor = {
    name: 'survey',
    type: 'survey',
    children: [
        {
            name: 'intro',
            type: 'group',
            label: 'Introduction',
            children: [
                { name: 'name', type: 'text', label: 'Name' },
                { name: 'age', type: 'integer', label: 'Age' },
            ],
        },
    ],
};

export const instanceData = {
    name: 'Ada',
    age: '36',
};
