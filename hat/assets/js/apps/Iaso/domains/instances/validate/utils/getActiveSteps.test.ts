import { describe, expect, it } from 'vitest';
import {
    mockResubmitWorkflow,
    mockTimeline,
    mockWorkflow,
} from '../testFixtures';
import {
    getActiveSteps,
    getValidationStepContext,
    getWorkflowTimeline,
} from './getActiveSteps';

describe('getWorkflowTimeline', () => {
    it('returns empty array for undefined workflow', () => {
        expect(getWorkflowTimeline(undefined)).toEqual([]);
    });

    it('returns empty array when submissions is empty', () => {
        expect(
            getWorkflowTimeline({
                workflow: 'test',
                total_steps: 0,
                validation_status: 'PENDING',
                submissions: [],
            }),
        ).toEqual([]);
    });

    it('returns timeline from first submission', () => {
        expect(getWorkflowTimeline(mockWorkflow)).toEqual(mockTimeline);
    });
});

describe('getActiveSteps', () => {
    it('returns empty array for undefined workflow', () => {
        expect(getActiveSteps(undefined)).toEqual([]);
    });

    it('excludes steps where user_can_do_actions is false', () => {
        const activeSteps = getActiveSteps(mockWorkflow);
        expect(activeSteps.map(step => step.id)).not.toContain(3);
    });

    it('excludes ACCEPTED steps', () => {
        const activeSteps = getActiveSteps(mockWorkflow);
        expect(activeSteps.every(step => step.status !== 'ACCEPTED')).toBe(
            true,
        );
    });

    it('excludes SKIPPED steps', () => {
        const activeSteps = getActiveSteps(mockWorkflow);
        expect(activeSteps.every(step => step.status !== 'SKIPPED')).toBe(true);
    });

    it('preserves descending timeline order among active steps', () => {
        const activeSteps = getActiveSteps(mockWorkflow);
        expect(activeSteps.map(step => step.id)).toEqual([2, 1]);
    });
});

describe('getValidationStepContext', () => {
    it('returns expectedNextStepId as the last active step', () => {
        const { expectedNextStepId } = getValidationStepContext(
            mockWorkflow,
            '1',
        );
        expect(expectedNextStepId).toBe(1);
    });

    it('returns expectedNextStepId from last active step on resubmit timeline', () => {
        const { expectedNextStepId } = getValidationStepContext(
            mockResubmitWorkflow,
            '185',
        );
        expect(expectedNextStepId).toBe(185);
    });

    it('returns null expectedNextStepId when no active steps remain', () => {
        const { expectedNextStepId } = getValidationStepContext(
            {
                workflow: 'test',
                total_steps: 0,
                validation_status: 'PENDING',
                submissions: [
                    {
                        created_at: '2024-01-01T09:00:00',
                        created_by: 'test user',
                        general_validation_status: 'PENDING',
                        active_steps: 0,
                        timeline: [],
                    },
                ],
            },
            undefined,
        );
        expect(expectedNextStepId).toBeNull();
    });

    it('returns selectedNodeSlug for active step', () => {
        const { selectedNodeSlug } = getValidationStepContext(
            mockWorkflow,
            '2',
        );
        expect(selectedNodeSlug).toBe('step-b');
    });

    it('returns empty selectedNodeSlug for unknown step', () => {
        const { selectedNodeSlug } = getValidationStepContext(
            mockWorkflow,
            '999',
        );
        expect(selectedNodeSlug).toBe('');
    });

    it('returns empty selectedNodeSlug for non-active step in timeline', () => {
        const { selectedNodeSlug, isSelectedStepActive } =
            getValidationStepContext(mockWorkflow, '3');
        expect(selectedNodeSlug).toBe('');
        expect(isSelectedStepActive).toBe(false);
    });

    it('marks active selected step as selectable', () => {
        const { isSelectedStepActive } = getValidationStepContext(
            mockWorkflow,
            '1',
        );
        expect(isSelectedStepActive).toBe(true);
    });
});
