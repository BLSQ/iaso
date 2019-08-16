
const testStatsSettings = [
    {
        key: 'total_population',
        label: 'PTR',
        color: '#FCB97D',
        defaultMessage: 'Total enumerated population',
        id: 'testStatsSettings.total_population',
    },
    {
        key: 'test_count',
        label: 'PTE',
        color: '#93C0A4',
        defaultMessage: 'Total population examined',
        id: 'testStatsSettings.test_count',
    },
    {
        key: 'screening_test',
        color: '#FF3824',
        label: '',
        defaultMessage: 'New cases',
        id: 'main.label.newCases',
        datas: [
            {
                key: 'catt_count',
                label: 'CATT',
                color: '#EDD892',
                defaultMessage: 'CATT tests done',
                id: 'testStatsSettings.catt_count',
            },
            {
                key: 'rdt_count',
                label: 'RDT',
                color: '#BEC4E2',
                defaultMessage: 'RDT tests done',
                id: 'testStatsSettings.rdt_count',
            },
        ],
    },
    {
        key: 'screening_test_positive',
        datas: [
            {
                key: 'positive_catt_count',
                label: 'CATT +',
                color: '#D3BCC0',
                defaultMessage: 'Positives CATT tests',
                id: 'testStatsSettings.positive_catt_count',
            },
            {
                key: 'positive_rdt_count',
                label: 'RDT +',
                color: '#A5668B',
                defaultMessage: 'Positives RDT tests',
                id: 'testStatsSettings.positive_rdt_count',
            },
        ],
    },
];

export default testStatsSettings;
