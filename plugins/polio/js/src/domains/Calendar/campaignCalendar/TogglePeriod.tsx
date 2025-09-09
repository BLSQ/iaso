import React, { FunctionComponent, useCallback } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useRedirectToReplace } from 'bluesquare-components';
import { useGetPeriodTypes } from '../hooks/useGetPeriodTypes';
import { CalendarParams, PeriodType } from './types';

type Props = {
    params: CalendarParams;
    url: string;
};

export const TogglePeriod: FunctionComponent<Props> = ({ params, url }) => {
    const redirectToReplace = useRedirectToReplace();

    const periodTypes = useGetPeriodTypes();

    const handleChangePeriodType = useCallback(
        (_, value: PeriodType) => {
            const newParams = {
                ...params,
                periodType: value,
            };

            redirectToReplace(url, newParams);
        },
        [params, redirectToReplace, url],
    );
    return (
        <ToggleButtonGroup
            color="primary"
            size="small"
            value={params.periodType || 'quarter'}
            exclusive
            onChange={handleChangePeriodType}
        >
            {periodTypes.map(period => (
                <ToggleButton key={period.value} value={period.value}>
                    {period.label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
};
