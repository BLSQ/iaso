import React, { useState, FunctionComponent, useEffect } from 'react';

import {
    Grid,
    Button,
    Box,
    makeStyles,
    useMediaQuery,
    useTheme,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
// @ts-ignore
import { commonStyles, useSafeIntl } from 'bluesquare-components';

import InputComponent from '../../../components/forms/InputComponent';
import { useFilterState } from '../../../hooks/useFilterState';

import MESSAGES from '../messages';

import { baseUrl } from '../config';
import { useGetPlanningsOptions } from '../../plannings/hooks/requests/useGetPlannings';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    showDeleted?: string;
    planning?: string;
};

type Props = {
    params: Params;
};

const Filters: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { filters, handleSearch, handleChange, filtersUpdated } =
        useFilterState({ baseUrl, params });
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const [showDeleted, setShowDeleted] = useState<boolean>(
        filters.showDeleted === 'true',
    );
    const { data: planningsDropdown } = useGetPlanningsOptions();

    const theme = useTheme();
    const isLargeLayout = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
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
                        type="select"
                        multi
                        keyValue="planning"
                        onChange={handleChange}
                        value={filters.planning}
                        label={MESSAGES.planning}
                        options={planningsDropdown}
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
                    <Box mt={isLargeLayout ? 2 : 0}>
                        <Button
                            data-test="search-button"
                            disabled={
                                (!showDeleted && !filtersUpdated) ||
                                textSearchError
                            }
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
            <Grid container>
                <Grid item xs={12}>
                    <InputComponent
                        keyValue="showDeleted"
                        onChange={(key, value) => {
                            handleChange('showDeleted', !showDeleted);
                            setShowDeleted(value);
                        }}
                        value={showDeleted}
                        type="checkbox"
                        label={MESSAGES.showDeleted}
                    />
                </Grid>
            </Grid>
        </>
    );
};

export { Filters };
