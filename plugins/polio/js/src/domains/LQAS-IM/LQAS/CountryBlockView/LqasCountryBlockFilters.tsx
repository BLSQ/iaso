import React, { FunctionComponent, useCallback } from 'react';
import {
    useRedirectToReplace,
    useSafeIntl,
    Select,
} from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import MESSAGES from '../../../../constants/messages';
import { baseUrls } from '../../../../constants/urls';
import { Side } from '../../../../constants/types';
import { generateYearOptions } from '../CountryOverview/utils';
import { useGetLqasCountryBlockOptions } from '../hooks/useGetLqasCountryBlockOptions';
import { LqasCountryBlockParams } from './LqasCountryBlock';

type Props = {
    params: LqasCountryBlockParams;
    side: Side;
};

const monthOptions = [
    { label: '01', value: '01' },
    { label: '02', value: '02' },
    { label: '03', value: '03' },
    { label: '04', value: '04' },
    { label: '05', value: '05' },
    { label: '06', value: '06' },
    { label: '07', value: '07' },
    { label: '08', value: '08' },
    { label: '09', value: '09' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' },
];

const yearOptions = generateYearOptions();

const baseUrl = baseUrls.lqasCountryBlock;

export const LqasCountryBlockFilter: FunctionComponent<Props> = ({
    params,
    side,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();

    const {
        data: countryBlockOptions,
        isFetching: isFetchingCountryBlockOptions,
    } = useGetLqasCountryBlockOptions({ side, params });

    const onChange = useCallback(
        (key, value) => {
            const newParams = {
                ...params,
                [key]: value,
            };
            if (key === `${side}Month` || key === `${side}Year`) {
                newParams[`${side}CountryBlock`] = undefined;
            }
            redirectToReplace(baseUrl, newParams);
        },
        [redirectToReplace, ...Object.values(params), side],
    );

    return (
        <Box mb={2}>
            <Grid container spacing={2}>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6}>
                        <Select
                            keyValue={`${side}Month`}
                            label={formatMessage(MESSAGES.month)}
                            clearable
                            multi={false}
                            value={params[`${side}Month`]}
                            options={monthOptions}
                            onChange={value => onChange(`${side}Month`, value)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <Select
                            keyValue={`${side}Year`}
                            label={formatMessage(MESSAGES.year)}
                            clearable={false}
                            multi={false}
                            value={params[`${side}Year`]}
                            options={yearOptions}
                            onChange={value => onChange(`${side}Year`, value)}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <Select
                        keyValue={`${side}Country`}
                        loading={isFetchingCountryBlockOptions}
                        label={formatMessage(MESSAGES.countryBlock)}
                        clearable
                        multi={false}
                        value={params[`${side}Country`]}
                        options={countryBlockOptions}
                        onChange={value =>
                            onChange(`${side}CountryBlock`, value)
                        }
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
