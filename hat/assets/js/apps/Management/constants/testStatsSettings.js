
const testStatsSettings = [
    {
        key: 'total_population',
        label: 'PTR',
        color: '#FCB97D',
        defaultMessage: 'Pop. totale recensée',
        id: 'testStatsSettings.total_population',
    },
    {
        key: 'test_count',
        label: 'PTE',
        color: '#93C0A4',
        defaultMessage: 'Pop. totale examinée',
        id: 'testStatsSettings.test_count',
    },
    {
        key: 'screening_test',
        color: '#FF3824',
        label: '',
        defaultMessage: 'Tests positifs',
        id: 'testStatsSettings.positive_tests',
        datas: [
            {
                key: 'catt_count',
                label: 'CATT',
                color: '#EDD892',
                defaultMessage: 'Tests CATT effectués',
                id: 'testStatsSettings.catt_count',
            },
            {
                key: 'rdt_count',
                label: 'RDT',
                color: '#BEC4E2',
                defaultMessage: 'Tests RDT effectués',
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
                defaultMessage: 'Tests CATT positifs',
                id: 'testStatsSettings.positive_catt_count',
            },
            {
                key: 'positive_rdt_count',
                label: 'RDT +',
                color: '#A5668B',
                defaultMessage: 'Tests RDT positifs',
                id: 'testStatsSettings.positive_rdt_count',
            },
        ],
    },
];

export default testStatsSettings;
