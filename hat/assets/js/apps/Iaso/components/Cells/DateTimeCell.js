import React from 'react';
import {
    displayDateFromTimestamp,
    textPlaceholder,
} from 'bluesquare-components';
import moment from 'moment';

/* DateTimeCell
   For use in Table's columns to display DateTime
 */
export const DateTimeCell = cellInfo =>
    cellInfo.value ? displayDateFromTimestamp(cellInfo.value) : textPlaceholder;

export const convertToDateTimeRfc = value =>
    value ? moment(value).format('LTS') : textPlaceholder;

export const DateTimeCellRfc = cellInfo =>
    convertToDateTimeRfc(cellInfo?.value);

/** Takes multiple date times that come in the for of a string, converts them and shows one line for each date time */
export const MultiDateTimeCellRfc = cellInfo => {
    const value = cellInfo?.value ?? '';
    const valueAsList = value.split(',');
    return (
        <>
            {valueAsList.map(lineData => (
                <div key={`${lineData}`}>{convertToDateTimeRfc(lineData)}</div>
            ))}
        </>
    );
};

export const convertToDate = value =>
    value ? moment(value).format('L') : textPlaceholder;

export const DateCell = cellInfo => {
    return convertToDate(cellInfo?.value);
};

/** Takes multiple date that come in the for of a string, converts them and shows one line for each date */
export const MultiDateCell = cellInfo => {
    const value = cellInfo?.value ?? '';
    const valueAsList = value.split(',');
    return (
        <>
            {valueAsList.map(lineData => (
                <div key={`${lineData}`}>{convertToDate(lineData)}</div>
            ))}
        </>
    );
};

export const convertValueIfDate = value => {
    //  returning numbers early as they can be valid moments (unix timestamps)
    if (typeof value === 'number') return value;
    const asMoment = moment(value);
    if (asMoment.isValid()) return asMoment.format('LTS');
    return value;
};
