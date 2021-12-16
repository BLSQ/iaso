export const IM_POC_URL = '/api/polio/imstats/';
// Including number in the name so it can be used with parseInt for Table sorting.
// FIXME there should be a cleaner way to do this
export const IM_PASS = '1imOK';
export const IM_WARNING = '2imWarning';
export const IM_FAIL = '3imFail';

export const districtColors = {
    [IM_PASS]: {
        color: 'green',
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [IM_WARNING]: {
        color: '#FFD835',
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
