import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { Box, Button, Grid, makeStyles } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { commonStyles } from 'bluesquare-components';
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
}) => {
    const [filtersUpdated, setFiltersUpdated] = React.useState(
        !defaultFiltersUpdated,
    );

    const classes = useStyles();
    const handleSearch = () => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
                page: 1,
            };
            if (!tempParams.searchActive && toggleActiveSearch) {
                tempParams.searchActive = true;
            }
            redirectTo(baseUrl, tempParams);
        }
        onSearch();
    };
    return (
        <>
            <Grid container spacing={4}>
                {Array(3)
                    .fill()
                    .map((x, i) => i + 1)
                    .map(column => (
                        <Grid
                            container
                            item
                            xs={12}
                            md={4}
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
            </Grid>
            <Box mb={2} mt={2} display="flex" justifyContent="flex-end">
                {extraComponent}
                <Button
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
        </>
    );
};

Filters.defaultProps = {
    baseUrl: '',
    filters: [],
    defaultFiltersUpdated: false,
    toggleActiveSearch: false,
    extraComponent: <></>,
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
};

export default Filters;
