import { OK_COLOR, WARNING_COLOR, FAIL_COLOR } from '../../styles/constants';

export const IM_POC_URL = '/api/polio/imstats/';
// Including number in the name so it can be used with parseInt for Table sorting.
// FIXME there should be a cleaner way to do this
export const IM_PASS = '1imOK';
export const IM_WARNING = '2imWarning';
export const IM_FAIL = '3imFail';

export const districtColors = {
    [IM_PASS]: {
        color: OK_COLOR,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [IM_WARNING]: {
        color: WARNING_COLOR,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [IM_FAIL]: {
        color: FAIL_COLOR,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
};

// keys of reasons for children not fingermarked in IM
export const ImNfmKeys = [
    'Tot_child_Absent_HH',
    'Tot_child_NC_HH',
    'Tot_child_NotVisited_HH',
    'Tot_child_NotRevisited_HH',
    'Tot_child_Asleep_HH',
    'Tot_child_Others_HH',
    'Tot_child_VaccinatedRoutine',
];
