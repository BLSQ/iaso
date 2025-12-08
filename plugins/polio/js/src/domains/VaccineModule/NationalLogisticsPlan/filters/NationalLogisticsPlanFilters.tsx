import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { UrlParams, useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { SearchButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/SearchButton';
import { useGetGroupDropdown } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import { baseUrls } from '../../../../constants/urls';
import { useGetCountriesOptions } from '../../SupplyChain/hooks/api/vrf';
import MESSAGES from '../messages';

export const usenationalLogisticsPlanFilters = (params: Partial<UrlParams>) => {
    return useFilterState({ baseUrl: baseUrls.nationalLogisticsPlan, params });
};

type Props = { params: any };

export const NationalLogisticsPlanFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        usenationalLogisticsPlanFilters(params);
    const { data: countries, isFetching: isFetchingCountries } =
        useGetCountriesOptions();
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'true' });

    return (
        <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="country"
                    value={filters.country}
                    onChange={handleChange}
                    loading={isFetchingCountries}
                    options={countries}
                    labelString={formatMessage(MESSAGES.country)}
                />
            </Grid>
            <Grid item xs={6} md={3}>
                <InputComponent
                    type="select"
                    clearable
                    multi
                    keyValue="country_blocks"
                    value={filters.country_blocks}
                    onChange={handleChange}
                    options={groupedOrgUnits}
                    loading={isFetchingGroupedOrgUnits}
                    labelString={formatMessage(MESSAGES.countryBlock)}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="flex-end"
                    height="100%"
                >
                    <SearchButton
                        disabled={!filtersUpdated}
                        onSearch={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
