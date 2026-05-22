import React, { useState, FunctionComponent, useCallback } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Grid, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useSafeIntl,
    useRedirectToReplace,
} from 'bluesquare-components';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from 'Iaso/domains/projects/hooks/requests';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrl } from '../config';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    projectsIds?: string;
    orgUnitTypeIds?: string;
};

type Props = {
    params: Params;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const [filters, setFilters] = useState({
        search: params.search,
        projectsIds: params.projectsIds,
        orgUnitTypeIds: params.orgUnitTypeIds,
    });
    const { data: orgUnitTypes, isFetching: isFetchingOuTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams: Params = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            redirectToReplace(baseUrl, tempParams);
        }
    }, [filtersUpdated, params, filters, redirectToReplace]);

    const handleChange = useCallback(
        (key, value) => {
            setFiltersUpdated(true);
            setFilters({
                ...filters,
                [key]: value,
            });
        },
        [filters],
    );

    return (
        <Grid container spacing={2}>
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

            <Grid
                item
                xs={12}
                sm={6}
                md={3}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                <Button
                    data-test="search-button"
                    disabled={textSearchError || !filtersUpdated}
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    onClick={() => handleSearch()}
                >
                    <SearchIcon className={classes.buttonIcon} />
                    {formatMessage(MESSAGES.search)}
                </Button>
            </Grid>
        </Grid>
    );
};

export { Filters };
