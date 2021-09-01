import {
    displayDateFromTimestamp,
    textPlaceholder,
} from 'bluesquare-components';

/* DateTimeCell
   For use in Table's columns to display DateTime
 */
export const DateTimeCell = cellInfo =>
    cellInfo.value ? displayDateFromTimestamp(cellInfo.value) : textPlaceholder;
