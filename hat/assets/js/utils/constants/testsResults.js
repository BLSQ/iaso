export const defaultTestResults = [
    {
        value: 2,
        label: {
            defaultMessage: 'Positive',
            id: 'main.label.positive',
        },
    },
    {
        value: 1,
        label: {
            defaultMessage: 'Negative',
            id: 'main.label.negative',
        },
    },
    {
        value: -1,
        label: {
            defaultMessage: 'Not done',
            id: 'main.label.notdone',
        },
    },
];

export const testResults = [
    ...defaultTestResults,
    {
        value: 0,
        label: {
            defaultMessage: 'Missing',
            id: 'main.label.test.missing',
        },
    },
];

export const pgTestResults = [
    ...defaultTestResults,
    {
        value: 0,
        label: {
            defaultMessage: 'Missing ganglia',
            id: 'main.label.test.missingGanglia',
        },
    },
];
