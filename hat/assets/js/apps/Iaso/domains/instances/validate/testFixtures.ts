import {
    Timeline,
    ValidationNodeRetrieveResponse,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';

const baseTimelineStep = {
    node_template_slug: 'step-a',
    updated_at: '2024-01-01T10:00:00',
    created_at: '2024-01-01T09:00:00',
    type: 'TIMELINE' as const,
    order: 1,
};

export const createTimelineStep = (
    overrides: Partial<Timeline> & Pick<Timeline, 'id' | 'name'>,
): Timeline => ({
    ...baseTimelineStep,
    user_can_do_actions: true,
    status: 'UNKNOWN',
    ...overrides,
});

export const mockTimeline: Timeline[] = [
    createTimelineStep({
        id: 4,
        name: 'Step D',
        status: 'SKIPPED',
        node_template_slug: 'step-d',
        order: 4,
    }),
    createTimelineStep({
        id: 3,
        name: 'Step C',
        user_can_do_actions: false,
        status: 'ACCEPTED',
        node_template_slug: 'step-c',
        order: 3,
    }),
    createTimelineStep({
        id: 2,
        name: 'Step B',
        node_template_slug: 'step-b',
        type: 'NEXT_BYPASS',
        status: undefined,
        order: 2,
    }),
    createTimelineStep({
        id: 1,
        name: 'Step A',
        node_template_slug: 'step-a',
        type: 'TIMELINE',
        status: 'UNKNOWN',
        order: 1,
    }),
];

export const mockTimelineWithStepGap: Timeline[] = [
    createTimelineStep({
        id: 5,
        name: 'Step E',
        type: 'NEXT_BYPASS',
        status: undefined,
        order: 3,
        node_template_slug: 'step-e',
    }),
    createTimelineStep({
        id: 2,
        name: 'Step B',
        status: 'SKIPPED',
        node_template_slug: 'step-b',
        order: 2,
    }),
    createTimelineStep({
        id: 1,
        name: 'Step A',
        node_template_slug: 'step-a',
        type: 'TIMELINE',
        status: 'UNKNOWN',
        order: 1,
    }),
];

// Mirrors a resubmit where the timeline is in descending order and the pending
// validation target is the last active step despite a misleading NEXT_STEP marker.
export const mockResubmitTimeline: Timeline[] = [
    createTimelineStep({
        id: 22,
        name: 'Audit',
        node_template_slug: 'audit',
        type: 'NEXT_BYPASS',
        status: undefined,
        order: 4,
    }),
    createTimelineStep({
        id: 21,
        name: 'Region',
        node_template_slug: 'region',
        type: 'NEXT_BYPASS',
        status: undefined,
        order: 3,
    }),
    createTimelineStep({
        id: 20,
        name: 'Zone',
        node_template_slug: 'zone',
        type: 'NEXT_STEP',
        status: undefined,
        order: 2,
    }),
    createTimelineStep({
        id: 185,
        name: 'Aire de santé',
        node_template_slug: 'aire-de-sante',
        type: 'TIMELINE',
        status: 'UNKNOWN',
        order: 1,
    }),
];

export const mockResubmitWorkflow: ValidationNodeRetrieveResponse = {
    workflow: 'test-resubmit',
    total_steps: 4,
    validation_status: 'PENDING',
    submissions: [
        {
            created_at: '2026-06-30T21:11:32.570097Z',
            created_by: 'Aldo Maccione',
            general_validation_status: 'PENDING',
            active_steps: 1,
            timeline: mockResubmitTimeline,
        },
    ],
};

export const mockWorkflowWithStepGap: ValidationNodeRetrieveResponse = {
    workflow: 'test-workflow-gap',
    total_steps: 3,
    validation_status: 'PENDING',
    submissions: [
        {
            created_at: '2024-01-01T09:00:00',
            created_by: 'test user',
            general_validation_status: 'PENDING',
            active_steps: 2,
            timeline: mockTimelineWithStepGap,
        },
    ],
};

export const mockWorkflow: ValidationNodeRetrieveResponse = {
    workflow: 'test-workflow',
    total_steps: 4,
    validation_status: 'PENDING',
    submissions: [
        {
            created_at: '2024-01-01T09:00:00',
            created_by: 'test user',
            general_validation_status: 'PENDING',
            active_steps: 2,
            timeline: mockTimeline,
        },
    ],
};

export const mockWorkflowEmptyBypassSlug: ValidationNodeRetrieveResponse = {
    ...mockWorkflow,
    submissions: [
        {
            ...mockWorkflow.submissions![0],
            timeline: [
                mockTimeline[0],
                mockTimeline[1],
                createTimelineStep({
                    id: 2,
                    name: 'Step B',
                    node_template_slug: '',
                    type: 'NEXT_BYPASS',
                    status: undefined,
                    order: 2,
                }),
                mockTimeline[3],
            ],
        },
    ],
};

const mockDiffResultEntry = {
    created_at: '2024-06-01T10:00:00Z',
    diff: [{ path: '/json/field_a', op: 'replace' }],
    new_value: [
        {
            fields: {
                json: {
                    field_a: 'new',
                    field_b: 'unchanged',
                },
            },
        },
    ],
    possible_fields: [{ name: 'field_a' }, { name: 'field_b' }],
};

const getMockDiffResults = (count: 0 | 1 | 2) => {
    if (count === 0) {
        return [];
    }
    if (count === 1) {
        return [mockDiffResultEntry];
    }
    return [
        mockDiffResultEntry,
        {
            created_at: '2024-06-01T09:00:00Z',
            new_value: [
                {
                    fields: {
                        json: {
                            field_a: 'old',
                            field_b: 'unchanged',
                        },
                    },
                },
            ],
            possible_fields: [{ name: 'field_a' }, { name: 'field_b' }],
        },
    ];
};

export const mockDiffResults = (count: 0 | 1 | 2) => ({
    count,
    has_next: false,
    has_previous: false,
    limit: 2,
    page: 1,
    pages: 1,
    results: getMockDiffResults(count),
});
