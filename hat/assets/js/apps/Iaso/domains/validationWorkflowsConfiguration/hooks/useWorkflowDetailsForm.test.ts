import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows/models/validationWorkflowRetrieve.zod';
import { useWorkflowDetailsForm } from './useWorkflowDetailsForm';

const workflow = (
    changes: Partial<ValidationWorkflowRetrieve> = {},
): ValidationWorkflowRetrieve =>
    ({
        id: 1,
        slug: 'household-survey-validation',
        name: 'Household survey validation',
        description: 'Checks the household survey submissions',
        forms: [{ id: 10, label: 'Household survey' }],
        node_templates: [],
        ...changes,
    }) as ValidationWorkflowRetrieve;

const setup = (initial?: ValidationWorkflowRetrieve) =>
    renderHook(({ current }) => useWorkflowDetailsForm(current), {
        initialProps: { current: initial },
    });

describe('useWorkflowDetailsForm', () => {
    it('takes the new server data when the user has no changes', () => {
        const { result, rerender } = setup(workflow());

        rerender({
            current: workflow({ name: 'Facility survey validation' }),
        });

        expect(result.current.details.name).toBe('Facility survey validation');
        expect(result.current.isDirty).toBe(false);
    });

    it('keeps the user changes when the server data is refetched', () => {
        const { result, rerender } = setup(workflow());

        act(() =>
            result.current.updateDetails({
                name: 'Community survey validation',
                description: 'Checks the community survey submissions',
                formIds: [10, 20],
            }),
        );
        // e.g. refetch on window focus, or while a save is in flight
        rerender({ current: workflow() });

        expect(result.current.details).toEqual({
            name: 'Community survey validation',
            description: 'Checks the community survey submissions',
            formIds: [10, 20],
        });
        expect(result.current.isDirty).toBe(true);
    });

    it('takes the server data after a save', () => {
        const { result, rerender } = setup(workflow());

        act(() =>
            result.current.updateDetails({
                description: 'Checks the household survey submissions ',
            }),
        );
        act(() => result.current.syncOnNextUpdate());
        rerender({ current: workflow({ description: 'Saved description' }) });

        expect(result.current.details.description).toBe('Saved description');
        expect(result.current.isDirty).toBe(false);

        // the sync is only done once: later changes are kept again
        act(() =>
            result.current.updateDetails({ name: 'Malaria survey validation' }),
        );
        rerender({ current: workflow({ description: 'Saved description' }) });
        expect(result.current.details.name).toBe('Malaria survey validation');
    });

    it('takes the server data after the creation', () => {
        const { result, rerender } = setup(undefined);

        act(() =>
            result.current.updateDetails({
                name: 'Household survey validation',
                description: 'Checks the household survey submissions',
                formIds: [10],
            }),
        );
        rerender({ current: workflow() });
        expect(result.current.isDirty).toBe(false);

        // the server data is now the base: a later server change is taken
        rerender({
            current: workflow({ name: 'Facility survey validation' }),
        });
        expect(result.current.details.name).toBe('Facility survey validation');
    });

    it('takes the server data again after a cancel', () => {
        const { result, rerender } = setup(workflow());

        act(() =>
            result.current.updateDetails({
                name: 'Community survey validation',
            }),
        );
        act(() => result.current.reset());
        expect(result.current.details.name).toBe('Household survey validation');

        rerender({
            current: workflow({ name: 'Facility survey validation' }),
        });
        expect(result.current.details.name).toBe('Facility survey validation');
    });
});
