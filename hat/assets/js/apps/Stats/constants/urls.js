
const epidemiologyUrls = [
    {
        name: 'coverage',
        url: '/api/stats/',
        mock: [],
    },
    {
        name: 'positiveScreeningRate',
        url: '/api/stats/?stat=positiveScreeningRate',
        mock: [],
    },
    {
        name: 'coordinations',
        url: '/api/coordinations/',
        mock: [],
    },
    {
        name: 'confirmationsRate',
        url: '/api/stats/?stat=confirmationsRate',
        mock: [],
    },
];

const datasMonitoringUrls = [
    {
        name: 'unmatch',
        url: '/api/metrics/unmatch/',
        mock: [],
    },
    {
        name: 'casecount',
        url: '/api/metrics/casecount/',
        mock: [],
    },
    {
        name: 'coordinations',
        url: '/api/coordinations/',
        mock: [],
    },
];

export {
    epidemiologyUrls,
    datasMonitoringUrls,
};
