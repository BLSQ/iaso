import {
    // @ts-ignore
    displayDateFromTimestamp,
    textPlaceholder,
} from 'bluesquare-components';
import moment from 'moment';

import React, { ReactElement } from 'react';
import { apiDateFormats } from '../../utils/dates';
/* DateTimeCell
   For use in Table's columns to display DateTime
 */
export const DateTimeCell = (cellInfo: { value?: number | null }): string =>
    cellInfo.value ? displayDateFromTimestamp(cellInfo.value) : textPlaceholder;

export const convertToDateTimeRfc = (
    value: string | null | undefined,
): string => (value ? moment(value).format('LTS') : textPlaceholder);

export const DateTimeCellRfc = (cellInfo: { value?: string | null }): string =>
    convertToDateTimeRfc(cellInfo?.value);

/** Takes multiple date times that come in the for of a string, converts them and shows one line for each date time */
export const MultiDateTimeCellRfc = (cellInfo: {
    value?: string | null;
}): ReactElement => {
    const value = cellInfo?.value ?? '';
    const valueAsList = value.split(',');
    return (
        <>
            {valueAsList.map((lineData, index) => (
                <div key={`${lineData}${index}`}>
                    {convertToDateTimeRfc(lineData)}
                </div>
            ))}
        </>
    );
};

export const convertToDate = (value: string | null | undefined): string =>
    value ? moment(value).format('L') : textPlaceholder;

export const DateCell = (cellInfo: { value?: string | null }): string =>
    convertToDate(cellInfo?.value);

/** Takes multiple date that come in the for of a string, converts them and shows one line for each date */
export const MultiDateCell = (cellInfo: {
    value?: string | null;
}): ReactElement => {
    const value = cellInfo?.value ?? '';
    const valueAsList = value.split(',');
    return (
        <>
            {valueAsList.map((lineData, index) => (
                <div key={`${lineData}${index}`}>{convertToDate(lineData)}</div>
            ))}
        </>
    );
};

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
