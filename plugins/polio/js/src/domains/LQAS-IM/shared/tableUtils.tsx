import React from 'react';
import { Tooltip, Typography } from '@material-ui/core';
import { IntlFormatMessage } from 'bluesquare-components';

export const makeTableText = (text: string) => {
    return (
        <Tooltip placement="bottom" title={text ?? 'no text'}>
            <Typography
                variant="body2"
                style={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {text}
            </Typography>
        </Tooltip>
    );
};

export const sortbyDistrictNameAsc = (a, b) =>
    a.name.localeCompare(b.name, undefined, {
        sensitivity: 'accent',
    });

export const sortbyDistrictNameDesc = (a, b) =>
    b.name.localeCompare(a.name, undefined, {
        sensitivity: 'accent',
    });
export const sortbyRegionNameAsc = (a, b) => {
    // taking undefined regions into account. Using z as value, so undefined will come on bottom
    const valueA = a.region_name ?? 'z';
    const valueB = b.region_name ?? 'z';
    return valueA.localeCompare(valueB, undefined, {
        sensitivity: 'accent',
    });
};

export const sortbyRegionNameDesc = (a, b) => {
    // taking undefined regions into account
    const valueA = a.region_name ?? 'z';
    const valueB = b.region_name ?? 'z';
    return valueB.localeCompare(valueA, undefined, {
        sensitivity: 'accent',
    });
};

// Assuming status is either a number, or can be resolved to one by parseInt
export const sortbyStatusAsc = (a, b) =>
    parseInt(a.status, 10) > parseInt(b.status, 10);
export const sortbyStatusDesc = (a, b) =>
    parseInt(a.status, 10) < parseInt(b.status, 10);

export const sortByFoundAsc = (a, b) => {
    const valueA = a.district ? 1 : 0;
    const valueB = b.district ? 1 : 0;
    return valueA > valueB;
};
export const sortByFoundDesc = (a, b) => {
    const valueA = a.district ? 1 : 0;
    const valueB = b.district ? 1 : 0;
    return valueA < valueB;
};
export const sortSourceKeys =
    (formatMessage: IntlFormatMessage, messages: any) => (a, b) => {
        if (a === 'caregivers_informed') return 0;
        if (a === 'Others') return 1;
        if (b === 'Others') return 0;
        return formatMessage(messages[a]).localeCompare(
            formatMessage(messages[b]),
            undefined,
            { sensitivity: 'accent' },
        );
    };
