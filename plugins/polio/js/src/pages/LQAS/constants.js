export const NIGER_POC_URL = '/api/polio/imstats/?country=niger-im';
// NIGER
export const NIGER_ORG_UNIT_ID = 29709;
// MAli
// export const NIGER_ORG_UNIT_ID = 29702;
// Congo Brazzaville
// export const NIGER_ORG_UNIT_ID = 29728;
// Sierra Leone
// export const NIGER_ORG_UNIT_ID = 29715;
// Guinea
// export const NIGER_ORG_UNIT_ID = 29694;
export const LQAS_PASS = 'lqasOK';
export const LQAS_DISQUALIFIED = 'lqasDisqualified';
export const LQAS_FAIL = 'lqasFail';

export const districtColors = {
    [LQAS_PASS]: {
        color: 'green',
        weight: '2',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_DISQUALIFIED]: {
        color: 'orange',
        weight: '2',
        opacity: '1',
        zIndex: '1',
    },
    [LQAS_FAIL]: {
        color: 'red',
        weight: '2',
        opacity: '1',
        zIndex: '1',
    },
};
