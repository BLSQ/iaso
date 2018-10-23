
const confirmationStatsSettings = [
    {
        key: 'positive_screening_test_count',
        label: 'Suspects',
        color: '#FCB97D',
        defaultMessage: 'Suspects',
        id: 'testStatsSettings.positive_screening_test_count',
    },
    {
        key: 'confirmation_test',
        datas: [
            {
                key: 'pg_count',
                label: 'PG',
                color: '#93C0A4',
                defaultMessage: 'Tests PG effectués',
                id: 'testStatsSettings.pg_count',
            },
            {
                key: 'ctcwoo_count',
                label: 'CTCWOO',
                color: '#EDD892',
                defaultMessage: 'Tests CTCWOO effectués',
                id: 'testStatsSettings.ctcwoo_count',
            },
            {
                key: 'maect_count',
                label: 'MAECT',
                color: '#C6B89E',
                defaultMessage: 'Tests MAECT effectués',
                id: 'testStatsSettings.maect_count',
            },
            {
                key: 'pl_count',
                label: 'PL',
                color: '#BEC4E2',
                defaultMessage: 'Tests PL effectués',
                id: 'testStatsSettings.pl_count',
            },
        ],
    },
    {
        key: 'confirmation_test_positive',
        datas: [
            {
                key: 'pg_count_positive',
                label: 'PG +',
                color: '#D3BCC0',
                defaultMessage: 'Tests PG positfs',
                id: 'testStatsSettings.pg_count_positive',
            },
            {
                key: 'ctcwoo_count_positive',
                label: 'CTCWOO +',
                color: '#A5668B',
                defaultMessage: 'Tests CTCWOO positifs',
                id: 'testStatsSettings.ctcwoo_count_positive',
            },
            {
                key: 'maect_count_positive',
                label: 'MAECT +',
                color: '#69306D',
                defaultMessage: 'Tests MAECT positifs',
                id: 'testStatsSettings.maect_count_positive',
            },
            {
                key: 'pl_count_positive',
                color: '#0E103D',
                label: 'PL +',
                defaultMessage: 'Tests PL positifs',
                id: 'testStatsSettings.positive_tests',
            },
        ],
    },
    // {
    //     key: 'positive_confirmation',
    //     datas: [
    //         {
    //             key: 'pl_count_stage1',
    //             label: '',
    //             color: 'orange',
    //             defaultMessage: 'Patient en stade 1',
    //             id: 'testStatsSettings.pl_count_stage1',
    //         },
    //         {
    //             key: 'pl_count_stage2',
    //             label: '',
    //             color: 'red',
    //             defaultMessage: 'Patient en stade 2',
    //             id: 'testStatsSettings.pl_count_stage2',
    //         },
    //     ],
    // },
];

export default confirmationStatsSettings;
