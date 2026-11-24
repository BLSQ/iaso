import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NodeTemplate, useStepsEditor } from './useStepsEditor';

const node = (slug: string, name: string): NodeTemplate =>
    ({
        id: slug.length,
        order: 1,
        slug,
        name,
        description: '',
        roles_required: [],
        can_skip_previous_nodes: false,
    }) as NodeTemplate;

const dataEntry = (name = 'Data entry') => node('data-entry', name);
const supervisorReview = (name = 'Supervisor review') =>
    node('supervisor-review', name);
const finalApproval = (name = 'Final approval') => node('final-approval', name);

const setup = (nodes: NodeTemplate[]) =>
    renderHook(({ nodes: current }) => useStepsEditor(current), {
        initialProps: { nodes },
    });

describe('useStepsEditor', () => {
    it('takes the new server data when the user has no changes', () => {
        const { result, rerender } = setup([dataEntry(), supervisorReview()]);

        rerender({ nodes: [dataEntry(), supervisorReview(), finalApproval()] });

        expect(result.current.steps.map(step => step.slug)).toEqual([
            'data-entry',
            'supervisor-review',
            'final-approval',
        ]);
        expect(result.current.isDirty).toBe(false);
    });

    it('keeps the user changes when the server data is refetched', () => {
        const { result, rerender } = setup([dataEntry(), supervisorReview()]);

        act(() =>
            result.current.updateStep('data-entry', {
                name: 'Household data entry',
            }),
        );
        // e.g. refetch on window focus, or while a save is in flight
        rerender({ nodes: [dataEntry(), supervisorReview()] });

        expect(result.current.steps[0].name).toBe('Household data entry');
        expect(result.current.isDirty).toBe(true);
    });

    it('keeps the user order when the server data is refetched', () => {
        const { result, rerender } = setup([dataEntry(), supervisorReview()]);

        act(() => result.current.moveStep('supervisor-review', 'data-entry'));
        rerender({ nodes: [dataEntry(), supervisorReview()] });

        expect(result.current.steps.map(step => step.slug)).toEqual([
            'supervisor-review',
            'data-entry',
        ]);
        expect(result.current.isOrderChanged).toBe(true);
    });

    it('takes the server data after a save', () => {
        const { result, rerender } = setup([dataEntry(), supervisorReview()]);

        act(() =>
            result.current.updateStep('data-entry', {
                name: 'Household data entry ',
            }),
        );
        act(() => result.current.syncOnNextUpdate());
        rerender({
            nodes: [dataEntry('Household data entry'), supervisorReview()],
        });

        expect(result.current.steps[0].name).toBe('Household data entry');
        expect(result.current.isDirty).toBe(false);

        // the sync is only done once: later changes are kept again
        act(() =>
            result.current.updateStep('supervisor-review', {
                name: 'District review',
            }),
        );
        rerender({
            nodes: [dataEntry('Household data entry'), supervisorReview()],
        });
        expect(result.current.steps[1].name).toBe('District review');
    });

    it('ignores spaces around the name for the changes', () => {
        const { result } = setup([dataEntry()]);

        act(() =>
            result.current.updateStep('data-entry', { name: ' Data entry ' }),
        );

        expect(result.current.isDirty).toBe(false);
    });

    it('takes the server data again after a cancel', () => {
        const { result, rerender } = setup([dataEntry()]);

        act(() =>
            result.current.updateStep('data-entry', {
                name: 'Household data entry',
            }),
        );
        act(() => result.current.reset());
        expect(result.current.steps[0].name).toBe('Data entry');

        rerender({ nodes: [dataEntry('Facility data entry')] });
        expect(result.current.steps[0].name).toBe('Facility data entry');
    });
});
