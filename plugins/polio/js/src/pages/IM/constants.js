export const IM_POC_URL = '/api/polio/imstats/';
export const IM_PASS = 'imOK';
export const IM_WARNING = 'imWarning';
export const IM_FAIL = 'imFail';

export const districtColors = {
    [IM_PASS]: {
        color: 'green',
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [IM_WARNING]: {
        color: 'orange',
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [IM_FAIL]: {
        color: 'red',
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
};
