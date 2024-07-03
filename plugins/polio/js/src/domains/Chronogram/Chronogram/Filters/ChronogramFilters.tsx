import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';
import { LinkWithLocation } from 'bluesquare-components';

import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';

import MESSAGES from '../messages';
import { ChronogramParams } from '../types';
import { baseUrls } from '../../../../constants/urls';
import { useGetCountries } from '../../../../hooks/useGetCountries';
import { Link } from 'react-router-dom';

type Props = {
    params: ChronogramParams;
};

const baseUrl = baseUrls.chronogram;

export const ChronogramFilters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();

    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });

    const { countriesData, isFetchingCountriesData: isFetchingCountries } =
        useGetCountries();
    const countriesOptions = (countriesData && countriesData.orgUnits) || [];

    const onTimeOptions = [
        {
            label: formatMessage(MESSAGES.yes),
            value: 'true',
        },
        {
            label: formatMessage(MESSAGES.no),
            value: 'false',
        },
    ];

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4} lg={4}>
                    <InputComponent
                        type="search"
                        keyValue="search"
                        value={filters.search}
                        onChange={handleChange}
                        onEnterPressed={handleSearch}
                        label={MESSAGES.filterLabelSearch}
                    />
                </Grid>
                <Grid item xs={12} md={4} lg={4}>
                    <InputComponent
                        loading={isFetchingCountries}
                        keyValue="country"
                        multi
                        clearable
                        onChange={handleChange}
                        value={filters.countries}
                        type="select"
                        options={countriesOptions.map(c => ({
                            label: c.name,
                            value: c.id,
                        }))}
                        label={MESSAGES.filterLabelCountry}
                    />
                </Grid>
                <Grid item xs={12} md={4} lg={4}>
                    <InputComponent
                        type="select"
                        clearable
                        keyValue="on_time"
                        value={filters.on_time}
                        onChange={handleChange}
                        options={onTimeOptions}
                        label={MESSAGES.filterLabelOnTime}
                    />
                </Grid>
            </Grid>
            <Grid container item justifyContent="flex-end">
                <Box mt={2}>
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
            <Grid container item justifyContent="flex-end" mt={4}>
                <LinkWithLocation to={`/${baseUrls.chronogramTemplateTask}`}>
                    {formatMessage(MESSAGES.linkToChronogramTemplateTask)}
                </LinkWithLocation>
            </Grid>
        </>
    );
};
