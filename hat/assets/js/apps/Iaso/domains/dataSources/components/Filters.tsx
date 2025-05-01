import SearchIcon from '@mui/icons-material/Search';
import { Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    accountId?: string;
    page?: string;
    pageSize?: string;
    order?: string;
    projectIds?: string;
};

type Props = {
    baseUrl: string;
    params: Params;
};

export const Filters: FunctionComponent<Props> = ({ baseUrl, params }) => {
    const { filters, filtersUpdated, handleChange, handleSearch } =
        useFilterState({ baseUrl, params, withPagination: true });
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={3} md={3}>
                <InputComponent
                    keyValue="projectIds"
                    onChange={handleChange}
                    value={filters.projectIds}
                    type="select"
                    options={allProjects}
                    label={MESSAGES.projects}
                    loading={isFetchingProjects}
                    onEnterPressed={handleSearch}
                    clearable
                    multi
                />
            </Grid>
            <Grid item xs={12} sm={3} md={3}>
                <InputComponent
                    keyValue="name"
                    onChange={handleChange}
                    value={filters.name}
                    type="search"
                    label={MESSAGES.name}
                    onEnterPressed={handleSearch}
                    clearable
                    multi
                />
            </Grid>

            <Grid
                item
                xs={12}
                sm={6}
                md={6}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                <Button
                    data-test="search-button"
                    disabled={!filtersUpdated}
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    onClick={handleSearch}
                >
                    <SearchIcon className={classes.buttonIcon} />
                    {formatMessage(MESSAGES.search)}
                </Button>
            </Grid>
        </Grid>
    );
};
