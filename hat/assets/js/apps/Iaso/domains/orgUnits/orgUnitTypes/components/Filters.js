import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Grid, Button, withStyles } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import { commonStyles } from 'bluesquare-components';

import { redirectTo as redirectToAction } from '../../../../routing/actions';
import FiltersComponent from '../../../../components/filters/FiltersComponent';

import { search } from '../../../../constants/filters';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
});

const Filters = ({ params, classes, baseUrl, redirectTo, onSearch }) => {
    const [filtersUpdated, setFiltersUpdated] = React.useState(false);
    const handleSearch = () => {
        if (filtersUpdated) {
            setFiltersUpdated(false);
            const tempParams = {
                ...params,
            };
            tempParams.page = 1;
            redirectTo(baseUrl, tempParams);
        }
        onSearch();
    };

    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <FiltersComponent
                        params={params}
                        baseUrl={baseUrl}
                        onFilterChanged={() => setFiltersUpdated(true)}
                        filters={[search()]}
                        onEnterPressed={() => handleSearch()}
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
                        disabled={!filtersUpdated}
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <SearchIcon className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.search} />
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

Filters.defaultProps = {
    baseUrl: '',
};

Filters.propTypes = {
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
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
