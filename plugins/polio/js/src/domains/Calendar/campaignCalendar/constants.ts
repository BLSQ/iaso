import { apiDateFormat } from '../../../../../../../hat/assets/js/apps/Iaso/utils/dates';

const defaultStaticColWidth = 45;
const colsCount = 13;
const dateFormat = apiDateFormat;
const colSpanTitle = 1;
const defaultOrder = 'first_round_started_at';

export const DEFAULT_CELL_COLOR = '#bcbcbc';
export const SUBACTIVITY_CELL_COLOR = 'rebeccapurple';
const colsCounts = {
    quarter: 13,
    semester: 26,
    year: 52,
};
export {
    colSpanTitle,
    colsCount,
    colsCounts,
    dateFormat,
    defaultOrder,
    defaultStaticColWidth,
};
