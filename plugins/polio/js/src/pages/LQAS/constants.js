import { OK_COLOR, WARNING_COLOR, FAIL_COLOR } from '../../styles/constants';

export const LQAS_POC_URL = '/api/polio/lqasstats/';
export const LQAS_PASS = '1lqasOK';
export const LQAS_DISQUALIFIED = '2lqasDisqualified';
export const LQAS_FAIL = '3lqasFail';

export const districtColors = {
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
export const nfmKeys = [
    'childabsent',
    'House_not_visited',
    'Other',
    'Vaccinated_but_not_FM',
    'Non_Compliance',
    'Child_was_asleep',
    'Child_is_a_visitor',
];
