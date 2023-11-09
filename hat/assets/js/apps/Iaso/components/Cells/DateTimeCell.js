import {
    displayDateFromTimestamp,
    textPlaceholder,
} from 'bluesquare-components';
import moment from 'moment';

import { longDateFormats } from '../../utils/dates.ts';

/* DateTimeCell
   For use in Table's columns to display DateTime
 */
export const DateTimeCell = cellInfo =>
    cellInfo.value ? displayDateFromTimestamp(cellInfo.value) : textPlaceholder;

export const DateTimeCellRfc = cellInfo =>
    cellInfo.value ? moment(cellInfo.value).format('LTS') : textPlaceholder;

export const DateCell = cellInfo =>
    cellInfo.value ? moment(cellInfo.value).format('L') : textPlaceholder;

export const convertValueIfDate = value => {
    const asMoment = moment(value);
    const locale = moment.locale();
    const formats = Object.values(longDateFormats[locale]);
    let formattedValue = value;
    formats.some(format => {
        if (moment(value, format, true).isValid()) {
            formattedValue = asMoment.format(format);
            return true;
        }
        return false;
    });
    return formattedValue;
};
