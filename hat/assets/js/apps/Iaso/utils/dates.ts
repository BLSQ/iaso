import moment from 'moment';

// this is the date format used in url params
export const dateFormat = 'DD-MM-YYYY';
/**
 * @param {String} date - date as a string
 */
export const getUrlParamDateObject = (
    date: moment.MomentInput,
): moment.Moment => {
    return moment(date, dateFormat);
};

// this is the date time format used in api calls
export const apiDateTimeFormat = 'YYYY-MM-DD HH:mm';

// this is the short date format used in api calls (only date not time!)
export const apiDateFormat = 'YYYY-MM-DD';

/**
 * @param {Object} date - date as a moment object
 */
export const getApiParamDateTimeString = (date: moment.Moment): string => {
    return date.format(apiDateTimeFormat);
};

/**
 * Convert a date string from a router params to a Date for the API
 * @param {Object} date - date as a moment object
 */
export const getApiParamDateString = (
    date: moment.MomentInput,
): string | undefined => {
    return date ? getUrlParamDateObject(date).format(apiDateFormat) : undefined;
};

/**
 * Convert a date string from a router params to a DateTime for the API
 * since it's the lower bound force it to the start of the day
 * @param  {String} dateFrom - date as string
 */
export const getFromDateString = (
    dateFrom: moment.MomentInput,
): string | null =>
    dateFrom
        ? getApiParamDateTimeString(
              getUrlParamDateObject(dateFrom).startOf('day'),
          )
        : null;
/**
 * Convert a date string from a router params to a DateTime for the API
 * since it's the *higher bound* force it to the *end of the day*
 * @param  {String} dateTo - date as string
 */
export const getToDateString = (dateTo: moment.MomentInput): string | null =>
    dateTo
        ? getApiParamDateTimeString(getUrlParamDateObject(dateTo).endOf('day'))
        : null;

const longDateFormats = {
    fr: {
        LT: 'HH:mm',
        LTS: 'DD/MM/YYYY HH:mm',
        L: 'DD/MM/YYYY',
        LL: 'Do MMMM YYYY',
        LLL: 'Do MMMM YYYY LT',
        LLLL: 'dddd, MMMM Do YYYY LT',
    },
    en: {
        LT: 'h:mm A',
        LTS: 'DD/MM/YYYY HH:mm',
        L: 'DD/MM/YYYY',
        LL: 'Do MMMM YYYY',
        LLL: 'Do MMMM YYYY LT',
        LLLL: 'dddd, MMMM Do YYYY LT',
    },
};

/**
 * Configure the local for time displayed to the user.
 * @param {"en"|"fr"} code - Language code string
 */
export const setLocale = (code: 'en' | 'fr') => {
    moment.locale(code);
    moment.updateLocale(code, {
        longDateFormat: longDateFormats[code],
        week: {
            dow: 1,
        },
    });
};

/**
 * Configure the local for time displayed to the user.
 * @param {"LT"|"LTS"|"L"|"LL"|"LLL"|"LLLL"} longType - Language code string
 */
export const getLocaleDateFormat = longType => {
    const locale = moment.locale();
    return longDateFormats[locale][longType];
};

// Convert from Api format to format expected by DateRange picker
export const dateApiToDateRangePicker = (dateStr?: string): string | null => {
    if (!dateStr) {
        return null;
    }
    return moment(dateStr, apiDateFormat).format(getLocaleDateFormat('L'));
};

// Convert from Api format to format expected by DateRange picker
export const dateRangePickerToDateApi = (
    dateStr?: string,
): string | undefined => {
    if (!dateStr) {
        return undefined;
    }
    return moment(dateStr, getLocaleDateFormat('L')).format(apiDateFormat);
};
