import {
    displayDateFromTimestamp,
    textPlaceholder,
} from 'bluesquare-components';
import moment from 'moment';

import React, { ReactElement } from 'react';
import { apiDateFormats } from '../../utils/dates';
import { Box, SxProps } from '@mui/material';
import { SxStyles } from '../../types/general';

export const styleEven = {backgroundColor:"blue"}
export const styleOdds = {backgroundColor:"red"}
export const sxLineStyle = {styleEven:{...styleEven}, styleOdds:{...styleOdds}}


/* DateTimeCell
   For use in Table's columns to display DateTime
 */
export const DateTimeCell = (cellInfo: {
    value?: number | null | undefined;
}): string => displayDateFromTimestamp(cellInfo?.value);

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

const formatStyles = (index:number,colorLines:boolean) : SxStyles|undefined => {
    if(!colorLines){
        return undefined
    }
    return index%2 > 0 ? sxLineStyle.styleEven : sxLineStyle.styleOdds
}

/** Takes multiple date that come in the for of a string, converts them and shows one line for each date */
export const MultiDateCell = ({
    value,
    colorLines = false
}:{
    value?: string | null,
    colorLines?:boolean
}): ReactElement => {
    const valueAsList = (value??'').split(',');
    return (
        <>
            {valueAsList.map((lineData, index) => (
                <Box key={`${lineData}${index}`} sx={formatStyles(index,colorLines)}>{convertToDate(lineData)}</Box>
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
