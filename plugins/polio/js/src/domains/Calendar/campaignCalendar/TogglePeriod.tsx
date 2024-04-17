/* eslint-disable camelcase */
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { replace } from 'react-router-redux';

import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { useGetPeriodTypes } from '../hooks/useGetPeriodTypes';
import { CalendarParams, PeriodType } from './types';

type Props = {
    params: CalendarParams;
    router: Router;
};

export const TogglePeriod: FunctionComponent<Props> = ({ params, router }) => {
    const dispatch = useDispatch();

    const periodTypes = useGetPeriodTypes();

    const handleChangePeriodType = (_, value: PeriodType) => {
        const newParams = {
            ...params,
            periodType: value,
        };
        const url = genUrl(router, newParams);
        dispatch(replace(url));
    };
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
