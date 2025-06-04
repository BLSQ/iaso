import { NO_DATA_COLOR, NO_DATA_COLOR_2 } from '../../../styles/constants';
import { LqasIMType } from '../types';

export const paperElevation = 2;
export const HASHED_MAP_PATTERN = 'greyStripes';
export const HASHED_BACKGROUND = `repeating-linear-gradient(-45deg,${NO_DATA_COLOR},${NO_DATA_COLOR} 5px,${NO_DATA_COLOR_2} 5px,${NO_DATA_COLOR_2} 10px)`;
export const IN_SCOPE = 'inScope';
export const DISTRICT = 'district';
export const COUNTRY = 'country';
export const LIST = 'list';
export const MAP = 'map';
export const LqasIMView = {
    lqas: 'lqas' as LqasIMType,
    imIHH: 'imIHH' as LqasIMType,
    imOHH: 'imOHH' as LqasIMType,
    imGlobal: 'imGlobal' as LqasIMType,
};
