import {
    // @ts-ignore
    displayDateFromTimestamp,
    textPlaceholder,
} from 'bluesquare-components';
import moment from 'moment';

import { apiDateFormats, getLocaleDateFormat } from '../../utils/dates';
/* DateTimeCell
   For use in Table's columns to display DateTime
 */
export const DateTimeCell = (cellInfo: { value?: number | null }): string =>
    cellInfo.value ? displayDateFromTimestamp(cellInfo.value) : textPlaceholder;

export const DateTimeCellRfc = (cellInfo: { value?: string | null }): string =>
    cellInfo.value
        ? moment(cellInfo.value).format(getLocaleDateFormat('LTS'))
        : textPlaceholder;

export const DateCell = (cellInfo: { value?: string | null }): string =>
    cellInfo.value
        ? moment(cellInfo.value).format(getLocaleDateFormat('L'))
        : textPlaceholder;

export const convertValueIfDate = (value: unknown): string | unknown => {
    if (typeof value !== 'string') {
        return value;
    }
    let formattedValue: string = value;
    apiDateFormats.forEach(({ apiFormat, momentFormat }) => {
        const momentValue = moment(value, apiFormat, true);
        if (momentValue.isValid()) {
            formattedValue = momentValue.format(momentFormat);
        }
    });
    return formattedValue;
};
