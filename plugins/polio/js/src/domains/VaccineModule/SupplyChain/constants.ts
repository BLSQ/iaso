export const VRF = 'vrf';
export const VAR = 'arrival_reports';
export const PREALERT = 'pre_alerts';
export const IPV_VACCINE = 'IPV';

export const apiUrl = '/api/polio/vaccine/request_forms/';

export const defaultVaccineOptions = [
    {
        label: 'nOPV2',
        value: 'nOPV2',
    },
    {
        label: 'mOPV2',
        value: 'mOPV2',
    },
    {
        label: 'bOPV',
        value: 'bOPV',
    },
    {
        label: 'nOPV2 & bOPV',
        value: 'nOPV2 & bOPV',
    },
];

export const ipvVaccineOption = {
    label: IPV_VACCINE,
    value: IPV_VACCINE,
};

export const singleVaccinesList = [
    {
        label: 'nOPV2',
        value: 'nOPV2',
    },
    {
        label: 'mOPV2',
        value: 'mOPV2',
    },
    {
        label: 'bOPV',
        value: 'bOPV',
    },
];

export const vrfVaccineFilterOptions = [
    ...singleVaccinesList,
    ipvVaccineOption,
];

export const fipvVaccineOptions = [ipvVaccineOption, ...singleVaccinesList];
