import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useGetGroupDropdown } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { FilterButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import { STOCK_MANAGEMENT } from '../../../../constants/routes';
import { useFilterState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import MESSAGES from '../messages';
import { polioVaccines } from '../../../../constants/virus';
import { useGetCountriesOptions } from '../../SupplyChain/hooks/api/vrf';
import { StockManagementListParams } from '../types';

const baseUrl = STOCK_MANAGEMENT;
type Props = { params: StockManagementListParams };

export const VaccineStockManagementFilters: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    // TODO refactor and move this hook
    const { data: countries, isFetching } = useGetCountriesOptions();
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'True' });
    return (
        <>
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
                </Grid>
                <Grid container item xs={12} md={6} lg={6}>
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
            <Grid container spacing={2}>
                <Grid item xs={6} md={3} lg={3}>
                    <InputComponent
                        type="select"
                        clearable
                        keyValue="country_id"
                        multi
                        value={filters.country_id}
                        onChange={handleChange}
                        loading={isFetching}
                        options={countries}
                        labelString={formatMessage(MESSAGES.country)}
                    />
                </Grid>
                <Grid item xs={6} md={3} lg={3}>
                    <InputComponent
                        type="select"
                        clearable
                        keyValue="country_blocks"
                        multi
                        value={filters.country_blocks}
                        onChange={handleChange}
                        loading={isFetchingGroupedOrgUnits}
                        options={groupedOrgUnits}
                        labelString={formatMessage(MESSAGES.countryBlock)}
                    />
                </Grid>
            </Grid>
        </>
    );
};
