export const reportsOperations = {};

// A new version or another published version changes both the project's report
// (published version) and the versions list of that report.
export const mutationInvalidates = [
    {
        onMutations: ['apiReportsVersionsCreate', 'apiReportsPublishCreate'],
        invalidates: [
            'apiReportsList',
            { query: 'apiReportsVersionsList', params: ['id'] },
        ],
    },
    {
        onMutations: [
            'apiReportsCreate',
            'apiReportsPartialUpdate',
            'apiReportsDestroy',
        ],
        invalidates: ['apiReportsList'],
    },
];
