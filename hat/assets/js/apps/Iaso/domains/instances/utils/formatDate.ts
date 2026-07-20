import { textPlaceholder } from 'bluesquare-components';
import moment from 'moment';
import { apiDateTimeFormat, apiRegexDateFormat } from 'Iaso/utils/dates';

/**
 * Format a form field's raw date/datetime value for display. Date-only values
 * (YYYY-MM-DD) are kept as is; ISO datetimes are shown without their seconds and
 * timezone (e.g. "2026-07-18T16:18:40.530+02:00" -> "2026-07-18 16:18"); a value
 * that is not a parseable ISO datetime (e.g. a bare time) is returned untouched.
 */
export const formatFieldDate = (raw: unknown): string => {
    if (typeof raw !== 'string' || raw === '') return String(raw ?? '');
    if (apiRegexDateFormat.test(raw)) return raw;
    const parsed = moment(raw, moment.ISO_8601, true);
    return parsed.isValid() ? parsed.format(apiDateTimeFormat) : raw;
};

/**
 * Format a Unix (seconds) timestamp as a date and time. Used instead of
 * bluesquare-components' displayDateFromTimestamp, which renders the time only
 * and so drops the date entirely.
 */
export const formatTimestamp = (timestamp?: number): string =>
    timestamp
        ? moment.unix(timestamp).format(apiDateTimeFormat)
        : textPlaceholder;
