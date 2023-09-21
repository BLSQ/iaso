import { FAIL_COLOR, OK_COLOR, WARNING_COLOR } from '../../../styles/constants';
import { IN_SCOPE } from '../shared/constants';

export const LQAS_POC_URL = '/api/polio/lqasstats/';
export const LQAS_PASS = '1lqasOK';
export const LQAS_DISQUALIFIED = '2lqasDisqualified';
export const LQAS_FAIL = '3lqasFail';
export const LQAS_DATASTORE_URL = '/api/datastore/lqas_';

export const lqasDistrictColors = {
    [LQAS_PASS]: {
        color: '#5e5e5e',
        weight: '2',
        opacity: '1',
        fillColor: OK_COLOR,
        fillOpacity: 0.8,
        zIndex: 999,
    },
    [LQAS_DISQUALIFIED]: {
        color: '#5e5e5e',
        fillColor: WARNING_COLOR,
        fillOpacity: 0.8,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_FAIL]: {
        color: '#5e5e5e',
        fillColor: FAIL_COLOR,
        fillOpacity: 0.8,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [IN_SCOPE]: {
        color: '#5e5e5e',
        opacity: '1',
        fillColor: 'grey',
        weight: '2',
        zIndex: 1,
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

// keys for reasons for absence in LQAS
export const lqasRfaKeys = [
    'Market',
    'School',
    'In_playground',
    'Farm',
    'Other',
    'Travelled',
    'unknown',
];
export const lqasBarColorTresholds = {
    ok: 80,
    warning: 50,
};
