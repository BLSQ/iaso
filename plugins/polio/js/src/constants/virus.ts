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

// linter shadow detection seems broken here
// eslint-disable-next-line no-unused-vars, no-shadow
enum VaccineNames {
    // eslint-disable-next-line no-unused-vars
    mOPV2 = 'mOPV2',
    // eslint-disable-next-line no-unused-vars
    nOPV2 = 'nOPV2',
    // eslint-disable-next-line no-unused-vars
    bOPV = 'bOPV',
}
type VaccineName = `${VaccineNames}`;
const vaccineNames: VaccineName[] = Object.keys(VaccineNames) as VaccineName[];

type Vaccine = {
    value: VaccineName;
    label: VaccineName;
    color: string;
};

const polioVaccines: Vaccine[] = [
    {
        value: VaccineNames.mOPV2,
        label: VaccineNames.mOPV2,
        color: '#66ff66',
    },
    {
        value: VaccineNames.nOPV2,
        label: VaccineNames.nOPV2,
        color: '#00b0f0',
    },
    {
        value: VaccineNames.bOPV,
        label: VaccineNames.bOPV,
        color: '#ffff00',
    },
];

export { polioViruses, polioVaccines, VaccineNames, vaccineNames, VaccineName };
