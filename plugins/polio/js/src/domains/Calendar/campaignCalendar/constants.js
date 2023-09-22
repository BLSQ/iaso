import { apiDateFormat } from 'Iaso/utils/dates.ts';

const defaultStaticColWidth = 45;
const colsCount = 16;
const dateFormat = apiDateFormat;
const colSpanTitle = 21;
const defaultOrder = 'first_round_started_at';

export {
    colsCount,
    dateFormat,
    colSpanTitle,
    defaultOrder,
    defaultStaticColWidth,
};
