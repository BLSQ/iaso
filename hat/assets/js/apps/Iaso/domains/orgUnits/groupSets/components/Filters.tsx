import React, { useState, FunctionComponent, useMemo } from 'react';

import { Grid, Button, Box, useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useSafeIntl } from 'bluesquare-components';

import { useFilterState } from '../../../../hooks/useFilterState';

import MESSAGES from '../messages';

import { baseUrl } from '../config';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import InputComponent from '../../../../components/forms/InputComponent';
import { useDataSourceVersions } from '../../../dataSources/requests';

const useStyles = makeStyles(theme => ({}));

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

const makeVersionsDropDown = sourceVersions => {
    if (sourceVersions == undefined) {
        return [];
    }
    console.log(sourceVersions);
    debugger;
    const existingVersions =
        sourceVersions
            .map(sourceVersion => {
                return {
                    label:
                        sourceVersion.data_source_name +
                        ' - ' +
                        sourceVersion.number.toString(),
                    value: sourceVersion.id,
                };
            })
            .sort((a, b) => parseInt(a.number, 10) > parseInt(b.number, 10)) ??
        [];
    return existingVersions;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, withPagination: false });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);

    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const { data: allSourceVersions, isLoading: areSourceVersionsLoading } =
        useDataSourceVersions();

    const sourceVersionsDropDown = useMemo(
        () => makeVersionsDropDown(allSourceVersions),
        [allSourceVersions, formatMessage],
    );

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
                    keyValue="sourceVersion"
                    onChange={handleChange}
                    value={filters.sourceVersion}
                    type="select"
                    options={sourceVersionsDropDown}
                    label={MESSAGES.sourceVersion}
                    blockForbiddenChars
                    onEnterPressed={handleSearch}
                    onErrorChange={setTextSearchError}
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
