export const assignmentsOperations = {
    apiMicroplanningPlanningsAssignmentsOrgUnitsList: {
        query: {
            options: {
                keepPreviousData: true,
            },
        },
    },
    apiMicroplanningPlanningsAssignmentsTeamsList: {
        query: {
            options: {
                keepPreviousData: true,
            },
        },
    },
};

export const mutationInvalidates = [
    {
        onMutations: [
            'apiMicroplanningAssignmentsCreate',
            'apiMicroplanningAssignmentsUpdate',
            'apiMicroplanningAssignmentsPartialUpdate',
            'apiMicroplanningAssignmentsDestroy',
            'apiMicroplanningAssignmentsBulkCreateAssignmentsCreate',
            'apiMicroplanningAssignmentsBulkDeleteAssignmentsCreate',
        ],
        // The nested planning lists are left out: without the planning id, their key falls back to every planning query.
        invalidates: ['apiMicroplanningAssignmentsList'],
    },
];
