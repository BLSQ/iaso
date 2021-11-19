export const NIGER_POC_URL = '/api/polio/imstats/?country=niger-im';
export const NIGER_ORG_UNIT_ID = 29709;
export const LQAS_STRICT_PASS = 'lqasStrictOK';
export const LQAS_STRICT_FAIL = 'lqasStrictFail';
export const LQAS_LAX_PASS = 'lqasLaxOk';
export const LQAS_LAX_FAIL = 'lqasLaxFail';

export const districtColors = {
    [LQAS_STRICT_PASS]: {
        color: 'green',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_STRICT_FAIL]: {
        color: 'red',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_LAX_PASS]: {
        color: 'limegreen',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_LAX_FAIL]: {
        color: 'black',
        weight: '1',
        opacity: '1',
        zIndex: '1',
    },
};
