import React, { useState, FunctionComponent } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import { Grid, Button, Box, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';

import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { baseUrl } from '../config';
import MESSAGES from '../messages';
import { mappingTypeOptions } from './MappingTypeOptions';

const useStyles = makeStyles(() => ({}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    formId?: string;
    mappingType?: string;
    projectsIds?: string;
};

type Props = {
    params: Params;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, withPagination: false });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const { data: orgUnitTypes, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const { data: allForms, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions();

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="search"
                    onChange={handleChange}
                    value={filters.search}
                    type="search"
                    label={MESSAGES.search}
                    blockForbiddenChars
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="formId"
                    onChange={handleChange}
                    value={filters.formId}
                    type="select"
                    options={allForms ?? []}
                    label={MESSAGES.forms}
                    loading={isFetchingForms}
                    onEnterPressed={handleSearch}
                    clearable
                    multi
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <InputComponent
                    type="select"
                    onChange={handleChange}
                    keyValue="mappingTypes"
                    multi
                    label={MESSAGES.mappingType}
                    value={filters.mappingTypes}
                    loading={false}
                    options={mappingTypeOptions ?? []}
                />
            </Grid>

            <Grid item xs={12} md={3}>
                <InputComponent
                    type="select"
                    onChange={handleChange}
                    keyValue="orgUnitTypeIds"
                    multi
                    label={MESSAGES.orgUnitsTypes}
                    value={filters.orgUnitTypeIds}
                    loading={isFetchingOuTypes}
                    options={orgUnitTypes ?? []}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <InputComponent
                    keyValue="projectsIds"
                    onChange={handleChange}
                    value={filters.projectsIds}
                    type="select"
                    options={allProjects}
                    label={MESSAGES.projects}
                    loading={isFetchingProjects}
                    onEnterPressed={handleSearch}
                    clearable
                    multi
                />
            </Grid>

            <Grid container item xs={12} md={12} justifyContent="flex-end">
                <Box mt={isLargeLayout ? 3 : 0}>
                    <Button
                        data-test="search-button"
                        disabled={!filtersUpdated || textSearchError}
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        {formatMessage(MESSAGES.search)}
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
};

export { Filters };
