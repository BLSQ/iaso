import React, { FunctionComponent, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FilterButton } from '../../../../components/FilterButton';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { useFilterState } from '../../../../hooks/useFilterState';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useOrgUnitConfigurationTypes } from '../hooks/useOrgUnitConfigurationTypes';
import MESSAGES from '../messages';
import { OrgUnitChangeRequestConfigsParams } from '../types';

const baseUrl = baseUrls.orgUnitsChangeRequestConfiguration;
type Props = { params: OrgUnitChangeRequestConfigsParams };

export const OrgUnitChangeRequestConfigsFilter: FunctionComponent<Props> = ({
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const { data: orgUnitTypeOptions, isLoading: isLoadingTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const types = useOrgUnitConfigurationTypes();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    keyValue="project_id"
                    onChange={handleChange}
                    value={filters.project_id}
                    type="select"
                    options={allProjects}
                    label={MESSAGES.project}
                    loading={isFetchingProjects}
                    onEnterPressed={handleSearch}
                    clearable
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="type"
                    value={filters.type}
                    onChange={handleChange}
                    options={types}
                    labelString={formatMessage(MESSAGES.type)}
                />
            </Grid>
            <Grid item xs={12} md={4} lg={3}>
                <InputComponent
                    type="select"
                    clearable
                    keyValue="org_unit_type_id"
                    value={filters.org_unit_type_id}
                    onChange={handleChange}
                    loading={isLoadingTypes}
                    options={orgUnitTypeOptions}
                    labelString={formatMessage(MESSAGES.orgUnitType)}
                />
            </Grid>
            <Grid
                item
                xs={12}
                md={4}
                lg={3}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                <Box mb={{ xs: 2, sm: 0 }}>
                    <FilterButton
                        disabled={!filtersUpdated}
                        onFilter={handleSearch}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
