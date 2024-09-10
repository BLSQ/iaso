import { Button, Grid } from '@mui/material';
import React, { FunctionComponent, useCallback, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../../messages';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    projectIds?: string;
};

type Props = {
    baseUrl: string;
    params: Params;
};

export const Filters: FunctionComponent<Props> = ({ baseUrl, params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const [filters, setFilters] = useState({
        projectIds: params.projectIds,
    });

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

    const redirectTo = useRedirectTo();
    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            redirectTo(baseUrl, tempParams);
        }
    }, [filtersUpdated, params, filters, redirectTo, baseUrl]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
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

            <Grid
                item
                xs={12}
                sm={6}
                md={9}
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
