import React, { useState, FunctionComponent, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { Grid, Button, makeStyles } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from '../../../components/forms/InputComponent';
import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';

import { baseUrl } from '../config';

import { useGetTypes } from '../entityTypes/hooks/requests/entitiyTypes';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    entityTypes?: string;
};

type Props = {
    params: Params;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const [filtersUpdated, setFiltersUpdated] = useState(false);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [filters, setFilters] = useState({
        search: params.search,
        entityTypes: params.entityTypes,
    });

    const { data: entityTypes, isFetching: fetchingEntitytypes } =
        useGetTypes();

    const handleSearch = useCallback(() => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                ...filters,
            };
            tempParams.page = '1';
            dispatch(redirectTo(baseUrl, tempParams));
        }
    }, [filtersUpdated, dispatch, filters, params]);

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
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleChange}
                        value={filters.search}
                        type="search"
                        label={MESSAGES.search}
                        onEnterPressed={handleSearch}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="entityTypes"
                        clearable
                        multi
                        onChange={handleChange}
                        value={filters.entityTypes}
                        type="select"
                        options={
                            entityTypes?.map(t => ({
                                label: t.name,
                                value: t.id,
                            })) ?? []
                        }
                        label={MESSAGES.types}
                        loading={fetchingEntitytypes}
                    />
                </Grid>
            </Grid>
            <Grid
                container
                spacing={4}
                justifyContent="flex-end"
                alignItems="center"
            >
                <Grid
                    item
                    xs={2}
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
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        {formatMessage(MESSAGES.search)}
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

export { Filters };
