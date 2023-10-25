import { LqasIMtype } from '../../../constants/types';
import { OK_COLOR, WARNING_COLOR, FAIL_COLOR } from '../../../styles/constants';

export const IM_POC_URL = '/api/polio/imstats/';
// Including number in the name so it can be used with parseInt for Table sorting.
// FIXME there should be a cleaner way to do this
export const IM_PASS = '1imOK';
export const IM_WARNING = '2imWarning';
export const IM_FAIL = '3imFail';

export const IN_SCOPE = 'inScope';
export const paperElevation = 2;
export const imDistrictColors = {
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

export const defaultRounds = [1, 2];

export const DISTRICT = 'district';
export const COUNTRY = 'country';
export const LIST = 'list';
export const MAP = 'map';
export const LqasIMView = {
    lqas: 'lqas' as LqasIMtype,
    imIHH: 'imIHH' as LqasIMtype,
    imOHH: 'imOHH' as LqasIMtype,
    imGlobal: 'imGlobal' as LqasIMtype,
};
