import {
    FAIL_COLOR,
    MODERATE_COLOR,
    NO_DATA_COLOR,
    OK_COLOR,
    POOR_COLOR,
    WARNING_COLOR,
} from '../../../styles/constants';
import { HASHED_MAP_PATTERN, IN_SCOPE } from '../shared/constants';
import { MapColorConfig } from '../types';

export const LQAS_PASS = '1lqasOK';
export const LQAS_DISQUALIFIED = '2lqasDisqualified';
export const LQAS_FAIL = '3lqasFail'; // shown as "Very poor" in the UI, still used in Afro map
export const LQAS_MODERATE = '3lqasmoderate';
export const LQAS_POOR = '3lqaspoor';
export const LQAS_VERY_POOR = '3lqasverypoor';
export const LQAS_OVERSAMPLED = '3lqasoversampled';
export const LQAS_UNDERSAMPLED = '3lqasundersampled';
export const LQAS_COUNTRY_URL = '/api/polio/lqasimmap/country/lqas_';

export const lqasDistrictColors: Record<string, MapColorConfig> = {
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
    [LQAS_VERY_POOR]: {
        color: '#5e5e5e',
        fillColor: FAIL_COLOR,
        fillOpacity: 0.8,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_MODERATE]: {
        color: '#5e5e5e',
        fillColor: MODERATE_COLOR,
        fillOpacity: 0.8,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_POOR]: {
        color: '#5e5e5e',
        fillColor: POOR_COLOR,
        fillOpacity: 0.8,
        weight: '2',
        opacity: '1',
        zIndex: 999,
    },
    [LQAS_UNDERSAMPLED]: {
        color: '#5e5e5e',
        opacity: '1',
        fillColor: `url(#${HASHED_MAP_PATTERN})`,
        weight: '2',
        zIndex: 999,
    },
    [LQAS_OVERSAMPLED]: {
        color: '#5e5e5e',
        opacity: '1',
        fillColor: `url(#${HASHED_MAP_PATTERN})`,
        weight: '2',
        zIndex: 999,
    },
    [IN_SCOPE]: {
        color: '#5e5e5e',
        opacity: '1',
        fillColor: NO_DATA_COLOR,
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
export const lqasBarColorThresholds = {
    ok: 80,
    warning: 50,
};
