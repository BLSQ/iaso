import moment from 'moment';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';
import { mapObject } from './objectUtils';

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
export const apiTimeFormat = 'HH:mm';

// this is the date time format used in api calls
export const apiDateTimeFormat = 'YYYY-MM-DD HH:mm';

// this is the short date format used in api calls (only date not time!)
export const apiDateFormat = 'YYYY-MM-DD';
export const apiRegexDateFormat = /^\d{4}-\d{2}-\d{2}$/;

// Mapping of API date and time formats to moment.js formats
export const apiMobileDateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

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
): string | null => {
    return date ? getUrlParamDateObject(date).format(apiDateFormat) : null;
};

/**
 * Convert a date string from a router params to a DateTime for the API
 * since it's the lower bound force it to the start of the day
 * @param  {String} dateFrom - date as string
 * @param  {boolean} includeTime - whether the time should be included into the resulted string.
 */
export const getFromDateString = (
    dateFrom: moment.MomentInput,
    includeTime = true,
): string | null => {
    if (dateFrom) {
        const m = getUrlParamDateObject(dateFrom);
        if (includeTime) {
            return getApiParamDateTimeString(m.startOf('day'));
        }
        return getApiParamDateString(m);
    }
    return null;
};
/**
 * Convert a date string from a router params to a DateTime for the API
 * since it's the *higher bound* force it to the *end of the day*
 * @param  {String} dateTo - date as string
 * @param  {boolean} includeTime - whether the time should be included into the resulted string.
 */
export const getToDateString = (
    dateTo: moment.MomentInput,
    includeTime = true,
): string | null => {
    if (dateTo) {
        const m = getUrlParamDateObject(dateTo);
        if (includeTime) {
            return getApiParamDateTimeString(m.endOf('day'));
        }
        return getApiParamDateString(m);
    }
    return null;
};

// Create a dynamic mapping of language codes to their date formats
export const longDateFormats = mapObject(LANGUAGE_CONFIGS, 'dateFormats');

/**
 * Configure the local for time displayed to the user.
 * @param {"LT"|"LTS"|"L"|"LL"|"LLL"|"LLLL"} longType - Language code string
 */
export const getLocaleDateFormat = longType => {
    const locale = moment.locale();
    return (
        LANGUAGE_CONFIGS[locale]?.dateFormats?.[longType] ||
        LANGUAGE_CONFIGS.en?.dateFormats?.[longType]
    );
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
    nullable = false,
): string | undefined | null => {
    if (!dateStr) {
        return nullable ? null : undefined;
    }
    return moment(dateStr, getLocaleDateFormat('L')).format(apiDateFormat);
};

type ApiDateFormat = {
    apiFormat: string;
    momentFormat: string;
};

export const apiDateFormats: ApiDateFormat[] = [
    { apiFormat: apiTimeFormat, momentFormat: getLocaleDateFormat('LT') },
    { apiFormat: apiDateTimeFormat, momentFormat: getLocaleDateFormat('LTS') },
    { apiFormat: apiDateFormat, momentFormat: getLocaleDateFormat('L') },
    {
        apiFormat: apiMobileDateFormat,
        momentFormat: getLocaleDateFormat('LTS'),
    },
];

/**
 * Formats a date string from one format to another. Returns undefined if the input date is not provided.
 *
 * @param date - The date string to format.
 * @param inputFormat - The format of the input date string.
 * @param outputFormat - The desired format of the output date string.
 * @returns The formatted date string or undefined.
 */
export const formatDateString = (
    date: string | undefined,
    inputFormat: string,
    outputFormat: string,
): string | undefined => {
    if (!date) return undefined;
    return moment(date, inputFormat).format(outputFormat);
};
