/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import SearchIcon from '@mui/icons-material/Search';

import { commonStyles, getParamsKey } from 'bluesquare-components';
import FiltersComponent from '../filters/FiltersComponent';

const MESSAGES = defineMessages({
    search: {
        id: 'iaso.label.textSearch',
        defaultMessage: 'Search',
    },
});

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    column: {
        '&>section': {
            width: '100%',
        },
    },
    icon: {
        color: theme.palette.ligthGray.border,
        fontWeight: 'light',
        fontSize: 150,
    },
}));

const Filters = ({
    params,
    baseUrl,
    redirectTo,
    onSearch,
    filters,
    defaultFiltersUpdated,
    toggleActiveSearch,
    extraComponent,
    paramsPrefix,
    filtersColumnsCount,
}) => {
    const [filtersUpdated, setFiltersUpdated] = React.useState(
        !defaultFiltersUpdated,
    );

    const classes = useStyles();
    const handleSearch = () => {
        let tempParams = null;
        if (filtersUpdated) {
            setFiltersUpdated(false);
            tempParams = {
                ...params,
                page: 1,
                [getParamsKey(paramsPrefix, 'page')]: 1,
            };
            if (!tempParams.searchActive && toggleActiveSearch) {
                tempParams.searchActive = true;
            }
            redirectTo(baseUrl, tempParams);
        }
        onSearch(tempParams);
    };

    return (
        <>
            <Grid container spacing={2}>
                {Array(filtersColumnsCount)
                    .fill()
                    .map((x, i) => i + 1)
                    .map(column => (
                        <Grid
                            container
                            item
                            xs={12}
                            md={3}
                            className={classes.column}
                            key={`column-${column}`}
                        >
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                onFilterChanged={() => setFiltersUpdated(true)}
                                filters={filters.filter(
                                    f => f.column === column,
                                )}
                                onEnterPressed={() => handleSearch()}
                            />
                        </Grid>
                    ))}

                <Grid
                    item
                    container
                    justifyContent="flex-end"
                    xs={12}
                    md={filtersColumnsCount === 3 ? 3 : 12}
                >
                    <Box mb={2} mt={filtersColumnsCount === 3 ? 2 : 0} p={0}>
                        {extraComponent}
                        <Button
                            data-test="search-button"
                            disabled={!filtersUpdated}
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={() => handleSearch()}
                        >
                            <SearchIcon className={classes.buttonIcon} />
                            <FormattedMessage {...MESSAGES.search} />
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};

Filters.defaultProps = {
    baseUrl: '',
    filters: [],
    defaultFiltersUpdated: false,
    toggleActiveSearch: false,
    extraComponent: <></>,
    paramsPrefix: null,
    filtersColumnsCount: 3,
};

Filters.propTypes = {
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    filters: PropTypes.array,
    defaultFiltersUpdated: PropTypes.bool,
    toggleActiveSearch: PropTypes.bool,
    extraComponent: PropTypes.node,
    paramsPrefix: PropTypes.string,
    filtersColumnsCount: PropTypes.number,
};

export default Filters;
