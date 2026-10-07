import { SubmissionField, SubmissionSection } from './types';

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

/** Section factory; `fields` is a shortcut for a section holding only questions. */
export const makeSection = ({
    fields = [
        makeField({
            kind: 'text',
            id: 'name',
            label: 'Name',
            value: 'Ada',
            rawValue: 'Ada',
        }),
    ],
    ...overrides
}: Partial<SubmissionSection> & {
    fields?: SubmissionField[];
} = {}): SubmissionSection => ({
    key: '/group_1',
    id: 'group_1',
    label: 'Introduction',
    depth: 0,
    items: fields.map(field => ({ type: 'field' as const, field })),
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
