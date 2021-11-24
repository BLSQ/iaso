export const NIGER_POC_URL = '/api/polio/imstats/?country=niger-im';
export const NIGER_ORG_UNIT_ID = 29709;
export const LQAS_PASS = 'lqasOK';
export const LQAS_DISQUALIFIED = 'lqasDisqualified';
export const LQAS_FAIL = 'lqasFail';

export const districtColors = {
    [LQAS_PASS]: {
        color: 'green',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_DISQUALIFIED]: {
        color: 'orange',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_FAIL]: {
        color: 'red',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
};
