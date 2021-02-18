import React from 'react';
import { FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Grid, Button, withStyles, Box } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import commonStyles from '../../styles/common';
import { redirectTo as redirectToAction } from '../../routing/actions';

import FiltersComponent from '../filters/FiltersComponent';

import MESSAGES from './messages';

const styles = theme => ({
    ...commonStyles(theme),
    column: {
        '&>section': {
            width: '100%',
        },
    },
});

const Filters = ({
    params,
    classes,
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
    const handleSearch = () => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
            };
            tempParams.page = 1;
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
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    filters: PropTypes.array,
    defaultFiltersUpdated: PropTypes.bool,
    toggleActiveSearch: PropTypes.bool,
    extraComponent: PropTypes.node,
};

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            redirectTo: redirectToAction,
        },
        dispatch,
    ),
});

export default connect(
    () => ({}),
    MapDispatchToProps,
)(withStyles(styles)(Filters));
