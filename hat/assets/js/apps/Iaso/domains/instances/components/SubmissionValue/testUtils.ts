import { SubmissionField } from '../SubmissionContent/types';

/** Minimal field factory for SubmissionValue tests. */
export const makeField = (
    overrides: Partial<SubmissionField> & Pick<SubmissionField, 'kind'>,
): SubmissionField => ({
    id: 'q1',
    label: 'Question',
    value: '',
    rawValue: '',
    empty: false,
    descriptor: { name: 'q1', type: 'text' } as SubmissionField['descriptor'],
    ...overrides,
});
