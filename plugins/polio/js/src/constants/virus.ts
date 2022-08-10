const polioViruses = [
    // Legacy values
    // {
    //     value: 'PV1',
    //     label: 'PV1',
    // },
    // {
    //     value: 'PV2',
    //     label: 'PV2',
    // },
    // {
    //     value: 'PV3',
    //     label: 'PV3',
    // },
    {
        value: 'PV1',
        label: 'cVDPV1',
    },
    {
        value: 'PV3',
        label: 'cVDPV3',
    },
    {
        value: 'cVDPV2',
        label: 'cVDPV2',
    },
    {
        value: 'WPV1',
        label: 'WPV1',
    },
];

type Vaccin = {
    value: string;
    label: string;
    color: string;
};

const polioVaccines: Vaccin[] = [
    {
        value: 'mOPV2',
        label: 'mOPV2',
        color: '#66ff66',
    },
    {
        value: 'nOPV2',
        label: 'nOPV2',
        color: '#00b0f0',
    },
    {
        value: 'bOPV',
        label: 'bOPV',
        color: '#ffff00',
    },
];

export { polioViruses, polioVaccines };
