import React, { FunctionComponent, useCallback } from 'react';
import {
    useRedirectToReplace,
    useSafeIntl,
    Select,
} from 'bluesquare-components';
import { LqasUrlParams } from '..';
import { Box, Grid } from '@mui/material';
import MESSAGES from '../../../../constants/messages';
import {
    useGetLqasCampaignsOptions,
    useGetLqasCountriesOptions,
} from '../hooks/useGetLqasCountriesOptions';
import { NumberAsString, Side } from '../../../../constants/types';
import { DropdownOptions } from 'Iaso/types/utils';
import moment from 'moment';

type Props = {
    params: LqasUrlParams;
    side: Side;
    currentUrl: string;
    isEmbedded: boolean;
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

// AI generated code
const generateYearOptions = (
    startYear = 2018,
): DropdownOptions<NumberAsString>[] => {
    const currentYear = moment().year();

    const years: DropdownOptions<NumberAsString>[] = [];

    for (let year = currentYear; year >= startYear; year--) {
        const yearStr = year.toString();
        years.push({ label: yearStr, value: yearStr });
    }

    return years;
};
const yearOptions = generateYearOptions();

export const LqasCountryFilter: FunctionComponent<Props> = ({
    params,
    side,
    currentUrl,
    isEmbedded,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();

    const { data: countriesOptions, isFetching: isFetchingCountriesOptions } =
        useGetLqasCountriesOptions({ side, params, isEmbedded });
    const { data: campaignsOptions, isFetching: isFetchingCampaignsOptions } =
        useGetLqasCampaignsOptions({ side, params, isEmbedded });

    const onChange = useCallback(
        (key, value) => {
            const newParams = {
                ...params,
                [key]: value,
            };
            if (key === `${side}Month` || key === `${side}Year`) {
                newParams[`${side}Country`] = undefined;
                newParams[`${side}Campaign`] = undefined;
                newParams[`${side}Round`] = undefined;
            }

            if (key === `${side}Country`) {
                newParams[`${side}Campaign`] = undefined;
                newParams[`${side}Round`] = undefined;
            }
            if (key === `${side}Campaign`) {
                newParams[`${side}Round`] = undefined;
            }

            // setFilters(newFilters);
            redirectToReplace(currentUrl, newParams);
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
                        loading={isFetchingCountriesOptions}
                        label={formatMessage(MESSAGES.country)}
                        clearable
                        multi={false}
                        value={params[`${side}Country`]}
                        options={countriesOptions}
                        onChange={value => onChange(`${side}Country`, value)}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Select
                        keyValue={`${side}Campaign`}
                        loading={isFetchingCampaignsOptions}
                        label={formatMessage(MESSAGES.campaign)}
                        clearable
                        multi={false}
                        value={params[`${side}Campaign`]}
                        options={campaignsOptions}
                        onChange={value => onChange(`${side}Campaign`, value)}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
