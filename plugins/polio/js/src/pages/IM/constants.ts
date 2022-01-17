import { OK_COLOR, WARNING_COLOR, FAIL_COLOR } from '../../styles/constants';

export const IM_POC_URL = '/api/polio/imstats/';
// Including number in the name so it can be used with parseInt for Table sorting.
// FIXME there should be a cleaner way to do this
export const IM_PASS = '1imOK';
export const IM_WARNING = '2imWarning';
export const IM_FAIL = '3imFail';
export const LQAS_POC_URL = '/api/polio/lqasstats/';
export const LQAS_PASS = '1lqasOK';
export const LQAS_DISQUALIFIED = '2lqasDisqualified';
export const LQAS_FAIL = '3lqasFail';

export const imDistrictColors = {
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

export const lqasDistrictColors = {
    [LQAS_PASS]: {
        color: OK_COLOR,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_DISQUALIFIED]: {
        color: WARNING_COLOR,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_FAIL]: {
        color: FAIL_COLOR,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
};

// keys of reasons for children not fingermarked in LQAS
export const lqasNfmKeys = [
    'childabsent',
    'House_not_visited',
    'Other',
    'Vaccinated_but_not_FM',
    'Non_Compliance',
    'Child_was_asleep',
    'Child_is_a_visitor',
];

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
export const imBarColorTresholds = {
    ok: 95,
    warning: 90,
};

export const lqasBarColorTresholds = {
    ok: 80,
    warning: 50,
};
