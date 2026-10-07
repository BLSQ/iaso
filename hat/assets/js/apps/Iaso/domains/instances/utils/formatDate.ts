import { textPlaceholder } from 'bluesquare-components';
import moment from 'moment';
import {
    apiDateFormat,
    apiRegexDateFormat,
    getLocaleDateFormat,
} from 'Iaso/utils/dates';

/**
 * Format a form field's raw date/datetime value for display, in the user's
 * locale format ('L' / 'LTS' from the language config). Date-only values
 * (YYYY-MM-DD) become the locale date; ISO datetimes become the locale date and
 * time, dropping the seconds and timezone (e.g.
 * "2026-07-18T16:18:40.530+02:00" -> "18/07/2026 16:18"); a value that is not a
 * parseable date is returned untouched.
 */
export const formatFieldDate = (raw: unknown): string => {
    if (typeof raw !== 'string' || raw === '') return String(raw ?? '');
    if (apiRegexDateFormat.test(raw)) {
        return moment(raw, apiDateFormat).format(getLocaleDateFormat('L'));
    }
    const parsed = moment(raw, moment.ISO_8601, true);
    return parsed.isValid() ? parsed.format(getLocaleDateFormat('LTS')) : raw;
};

/**
 * Format a Unix (seconds) timestamp as a locale date and time. Used instead of
 * bluesquare-components' displayDateFromTimestamp, which renders the time only
 * and so drops the date entirely.
 */
export const formatTimestamp = (timestamp?: number): string =>
    timestamp
        ? moment.unix(timestamp).format(getLocaleDateFormat('LTS'))
        : textPlaceholder;
