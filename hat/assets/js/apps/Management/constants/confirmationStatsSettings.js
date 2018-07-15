
const confirmationStatsSettings = [
    {
        key: 'positive_screening_test_count',
        label: '',
        color: '#FCB97D',
        defaultMessage: 'Suspects',
        id: 'testStatsSettings.positive_screening_test_count',
    },
    {
        key: 'confirmation_test',
        datas: [
            {
                key: 'pg_count',
                label: '',
                color: '#93C0A4',
                defaultMessage: 'Tests PG effectués',
                id: 'testStatsSettings.pg_count',
            },
            {
                key: 'ctcwoo_count',
                label: '',
                color: '#EDD892',
                defaultMessage: 'Tests CTCWOO effectués',
                id: 'testStatsSettings.ctcwoo_count',
            },
            {
                key: 'maect_count',
                label: '',
                color: '#C6B89E',
                defaultMessage: 'Tests MAECT effectués',
                id: 'testStatsSettings.maect_count',
            },
        ],
    },
    {
        key: 'pl_count',
        label: '',
        color: '#BEC4E2',
        defaultMessage: 'Test PG effectués',
        id: 'testStatsSettings.pl_count',
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
