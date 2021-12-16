export const LQAS_POC_URL = '/api/polio/lqasstats/';
export const LQAS_PASS = '1lqasOK';
export const LQAS_DISQUALIFIED = '2lqasDisqualified';
export const LQAS_FAIL = '3lqasFail';

export const districtColors = {
    [LQAS_PASS]: {
        color: 'green',
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_DISQUALIFIED]: {
        color: '#FFD835',
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_FAIL]: {
        color: 'red',
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
};
