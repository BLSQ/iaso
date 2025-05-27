import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    useRedirectToReplace,
    useSafeIntl,
    Select,
} from 'bluesquare-components';
import { LqasUrlParams } from '../lqas';
import { Box, Grid } from '@mui/material';
import MESSAGES from '../../../../constants/messages';
import { MonthYear, Side } from '../../../../constants/types';
import { baseUrls } from '../../../../constants/urls';
import moment from 'moment';
import {
    useGetLqasCampaignsOptions,
    useGetLqasCountriesOptions,
} from './useGetLqasCountriesOptions';

type Props = {
    params: LqasUrlParams;
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

// TODO get from backend
const yearOptions = [
    { label: '2025', value: '2025' },
    { label: '2024', value: '2024' },
    { label: '2023', value: '2023' },
    { label: '2022', value: '2022' },
    { label: '2021', value: '2021' },
    { label: '2020', value: '2020' },
    { label: '2019', value: '2019' },
    { label: '2018', value: '2018' },
    { label: '2017', value: '2017' },
];

const baseUrl = baseUrls.lqasCountry;

export const LqasCountryFilter: FunctionComponent<Props> = ({
    params,
    side,
}) => {
    console.log('side', side);
    console.log('params', params);
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    // const [filters, setFilters] = useState<LqasUrlParams>({
    //     ...params,
    // });

    const { data: countriesOptions, isFetching: isFetchingCountriesOptions } =
        useGetLqasCountriesOptions({ side, params });
    const { data: campaignsOptions, isFetching: isFetchingCampaignsOptions } =
        useGetLqasCampaignsOptions({ side, params });

    const onChange = useCallback(
        (key, value) => {
            const newParams = {
                ...params,
                [key]: value,
            };
            if (key === `${side}Month`) {
                // newParams[`${side}Year`] = undefined;
                newParams[`${side}Country`] = undefined;
                newParams[`${side}Campaign`] = undefined;
                newParams[`${side}Round`] = undefined;
            }
            if (key === `${side}Year`) {
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
            redirectToReplace(baseUrl, newParams);
        },
        [redirectToReplace, ...Object.values(params), side],
    );

    return (
        <Box>
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
