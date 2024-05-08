import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { DatePicker, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import MESSAGES from '../messages';
import { polioVaccines } from '../../../../constants/virus';
import { apiDateFormat } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/dates';
import { useGetCountriesOptions } from '../hooks/api/vrf';
import { useGetGroupDropdown } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';

type Props = { params: any };

export const VaccineSupplyChainFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl: baseUrls.vaccineSupplyChain, params });
    const { data: countries, isFetching } = useGetCountriesOptions();
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'True' });
    return (
        <Grid container spacing={2}>
            <Grid item xs={6} md={3} lg={3}>
                <InputComponent
                    type="search"
                    clearable
                    keyValue="search"
                    value={filters.search}
                    onChange={handleChange}
                    loading={false}
                    labelString={formatMessage(MESSAGES.search)}
                    onEnterPressed={handleSearch}
                />
                <Box mt={2}>
                    <DatePicker
                        label={formatMessage(MESSAGES.RoundStartFrom)}
                        onChange={date =>
                            handleChange(
                                'rounds__started_at__gte',
                                date ? date.format(apiDateFormat) : null,
                            )
                        }
                        currentDate={filters.rounds__started_at__gte}
                        clearable
                        clearMessage={MESSAGES.clear}
                    />
                </Box>
            </Grid>
            <Grid item xs={6} md={3} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="campaign__country"
                    value={filters.campaign__country}
                    onChange={handleChange}
                    loading={isFetching}
                    options={countries}
                    labelString={formatMessage(MESSAGES.country)}
                />
                <Box mt={2}>
                    <DatePicker
                        label={formatMessage(MESSAGES.RoundStartTo)}
                        onChange={date =>
                            handleChange(
                                'rounds__started_at__lte',
                                date ? date.format(apiDateFormat) : null,
                            )
                        }
                        currentDate={filters.rounds__started_at__lte}
                        clearable
                        clearMessage={MESSAGES.clear}
                    />
                </Box>
            </Grid>
            <Grid item xs={6} md={3} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="vaccine_type"
                    value={filters.vaccine_type}
                    onChange={handleChange}
                    options={polioVaccines.map(vaccine => ({
                        label: vaccine.label,
                        value: vaccine.value,
                    }))}
                    labelString={formatMessage(MESSAGES.vaccine)}
                />
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
            <Grid container item xs={12} md={3} lg={3}>
                <Box
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="end"
                    flexDirection="column"
                    width="100%"
                >
                    <Box mt={2}>
                        <FilterButton
                            disabled={!filtersUpdated}
                            onFilter={handleSearch}
                        />
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
};
