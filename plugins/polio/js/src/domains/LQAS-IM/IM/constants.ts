import { OK_COLOR, WARNING_COLOR, FAIL_COLOR } from '../../../styles/constants';
import { HASHED_MAP_PATTERN, IN_SCOPE } from '../shared/constants';
import { MapColorConfig } from '../types';

export const IM_COUNTRY_URL = '/api/polio/lqasimmap/country/';
export const IM_OHH_SLUG = 'im_ohh';
export const IM_HH_SLUG = 'im_hh';
export const IM_GLOBAL_SLUG = 'im_hh_ohh';
// Including number in the name so it can be used with parseInt for Table sorting.
// FIXME there should be a cleaner way to do this
export const IM_PASS = '1imOK';
export const IM_WARNING = '2imWarning';
export const IM_FAIL = '3imFail';
export const IM_ERROR = '4imError';

export const imDistrictColors: Record<string, MapColorConfig> = {
    [IM_PASS]: {
        color: '#5e5e5e',
        weight: '2',
        opacity: '1',
        fillColor: OK_COLOR,
        fillOpacity: 0.8,
        zIndex: 999,
    },
    [IM_WARNING]: {
        color: '#5e5e5e',
        weight: '2',
        opacity: '1',
        fillColor: WARNING_COLOR,
        fillOpacity: 0.8,
        zIndex: 999,
    },
    [IM_FAIL]: {
        color: '#5e5e5e',
        weight: '2',
        opacity: '1',
        fillColor: FAIL_COLOR,
        fillOpacity: 0.8,
        zIndex: 999,
    },
    [IM_ERROR]: {
        color: '#5e5e5e',
        opacity: '1',
        fillColor: `url(#${HASHED_MAP_PATTERN})`,
        weight: '2',
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

// keys for reasons for absence in IM
export const imRfaKeys = [
    'Tot_child_Abs_Farm',
    'Tot_child_Abs_Other',
    'Tot_child_Abs_Market',
    'Tot_child_Abs_School',
    'Tot_child_Abs_Play_areas',
    'Tot_child_Abs_Travelling',
    'Tot_child_Abs_Social_event',
    'Tot_child_Abs_Parent_Absent',
];

// keys of reasons for children not fingermarked in IM
export const imNfmKeys = [
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
