import React, { FunctionComponent, useMemo, useState } from 'react';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Grid, useMediaQuery, useTheme } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { useFilterState } from '../../../../hooks/useFilterState';

import MESSAGES from '../messages';

import InputComponent from '../../../../components/forms/InputComponent';
import { useDataSourceVersions } from '../../../dataSources/requests';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { baseUrl } from '../config';

type Params = {
    search?: string;
    sourceVersion?: string;
    projectsIds?: string;
    accountId: string;
};

type Props = {
    params: Params;
};

const makeVersionsDropDown = sourceVersions => {
    if (sourceVersions === undefined) {
        return [];
    }

    const existingVersions =
        sourceVersions
            .map(sourceVersion => {
                return {
                    label: `${
                        sourceVersion.data_source_name
                    } - ${sourceVersion.number.toString()}`,
                    value: sourceVersion.id,
                };
            })
            .sort((a, b) => parseInt(a.number, 10) > parseInt(b.number, 10)) ??
        [];
    return existingVersions;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params, withPagination: true });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);

    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    const { data: allSourceVersions, isLoading: areSourceVersionsLoading } =
        useDataSourceVersions();

    const sourceVersionsDropDown = useMemo(
        () => makeVersionsDropDown(allSourceVersions),
        [allSourceVersions],
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
                    loading={areSourceVersionsLoading}
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
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon />
                        {formatMessage(MESSAGES.search)}
                    </Button>
                </Box>
            </Grid>
        </Grid>
    );
};

export { Filters };
