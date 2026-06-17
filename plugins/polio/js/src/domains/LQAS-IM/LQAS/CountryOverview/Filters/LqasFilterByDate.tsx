import React, { FunctionComponent, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import {
    useRedirectToReplace,
    useSafeIntl,
    Select,
} from 'bluesquare-components';
import moment from 'moment';
import { DropdownOptions } from 'Iaso/types/utils';
import { LqasUrlParams } from '../..';
import MESSAGES from '../../../../../constants/messages';
import { NumberAsString, Side } from '../../../../../constants/types';
import {
    useGetLqasCampaignsOptions,
    useGetLqasCountriesOptions,
} from '../../hooks/useGetLqasCountriesOptions';

type Props = {
    params: LqasUrlParams;
    currentUrl: string;
    side: Side;
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

export const LqasFilterByDate: FunctionComponent<Props> = ({
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [redirectToReplace, ...Object.values(params), side],
    );

    return (
        <Box
            sx={{
                my: 2,
            }}
        >
            <Grid container spacing={2}>
                <Grid container spacing={2} size={12}>
                    <Grid size={6}>
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
                    <Grid size={6}>
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
                <Grid size={12}>
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
                <Grid size={12}>
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
