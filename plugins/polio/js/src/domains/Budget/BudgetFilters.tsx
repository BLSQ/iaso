/* eslint-disable camelcase */
/* eslint-disable react/require-default-props */
import { Box, Grid, useMediaQuery, useTheme } from '@mui/material';
import React, { FunctionComponent, useState } from 'react';
import { UrlParams } from 'bluesquare-components';
import { FilterButton } from '../../../../../../hat/assets/js/apps/Iaso/components/FilterButton';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useFilterState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState';
import MESSAGES from '../../constants/messages';
import { BUDGET } from '../../constants/routes';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useGetCountries } from '../../hooks/useGetCountries';
import { useGetGroupDropdown } from '../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/hooks/requests/useGetGroups';

type Props = {
    params: UrlParams & {
        showOnlyDeleted: boolean;
        roundStartTo: string;
        roundStartFrom: string;
        countries: any;
        org_unit_groups: any;
        campaign: string;
        // eslint-disable-next-line camelcase
        current_state_key: string;
    };
    statesList?: DropdownOptions<string>[];
    buttonSize?: 'medium' | 'small' | 'large' | undefined;
};

const baseUrl = BUDGET;
export const BudgetFilters: FunctionComponent<Props> = ({
    params,
    buttonSize = 'medium',
    statesList = [],
}) => {
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const theme = useTheme();
    const isXSLayout = useMediaQuery(theme.breakpoints.down('xs'));
    const { data, isFetching: isFetchingCountries } = useGetCountries();
    const { data: groupedOrgUnits, isFetching: isFetchingGroupedOrgUnits } =
        useGetGroupDropdown({ blockOfCountries: 'True' });
    const countriesList = (data && data.orgUnits) || [];
    return (
        <Box mb={isXSLayout ? 4 : 2}>
            <Grid container spacing={isXSLayout ? 0 : 2}>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                        onErrorChange={setTextSearchError}
                        blockForbiddenChars
                    />
                    <InputComponent
                        type="select"
                        multi={false}
                        keyValue="current_state_key"
                        onChange={handleChange}
                        value={filters.current_state_key}
                        options={statesList}
                        label={MESSAGES.status}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        loading={isFetchingGroupedOrgUnits}
                        keyValue="org_unit_groups"
                        multi
                        clearable
                        onChange={handleChange}
                        value={filters.org_unit_groups}
                        type="select"
                        options={groupedOrgUnits}
                        label={MESSAGES.countryBlock}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <InputComponent
                        loading={isFetchingCountries}
                        keyValue="countries"
                        multi
                        clearable
                        onChange={handleChange}
                        value={filters.countries}
                        type="select"
                        options={countriesList.map(c => ({
                            label: c.name,
                            value: c.id,
                        }))}
                        label={MESSAGES.country}
                    />
                </Grid>
                <Grid container item xs={12} md={3} justifyContent="flex-end">
                    <Box mt={2}>
                        <FilterButton
                            disabled={textSearchError || !filtersUpdated}
                            onFilter={handleSearch}
                            size={buttonSize}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
