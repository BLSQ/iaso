import React, { Component, Fragment } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';


import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Search from '@material-ui/icons/Search';

import commonStyles from '../../styles/common';

import {
    search,
    status,
    hasInstances,
    orgUnitType,
    source,
    subSource,
    shape,
    location,
} from '../../constants/filters';

import FiltersComponent from './FiltersComponent';
import OrgUnitsLevelsFiltersComponent from './OrgUnitsLevelsFiltersComponent';

import { createUrl } from '../../../../utils/fetchData';

const styles = theme => ({
    ...commonStyles(theme),
});

class OrgUnitsFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersUpdated: true,
        };
    }

    onFilterChanged() {
        this.setState({
            filtersUpdated: true,
        });
    }

    onSearch() {
        if (this.state.filtersUpdated) {
            this.setState({
                filtersUpdated: false,
            });
            const tempParams = {
                ...this.props.params,
            };
            tempParams.page = 1;
            this.props.redirectTo(this.props.baseUrl, tempParams);
        }
        this.props.onSearch();
    }

    render() {
        const {
            params,
            classes,
            baseUrl,
            intl: {
                formatMessage,
            },
            orgUnitTypes,
            sources,
        } = this.props;
        const { filtersUpdated } = this.state;
        return (
            <Fragment>
                <Grid container spacing={4}>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                search(),
                                hasInstances(formatMessage),
                            ]}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                location(formatMessage),
                                shape(formatMessage),
                                orgUnitType(formatMessage, orgUnitTypes),
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                source(formatMessage, sources),
                                status(formatMessage),
                            ]}
                        />
                        <OrgUnitsLevelsFiltersComponent
                            onLatestIdChanged={() => this.onFilterChanged()}
                            params={params}
                            baseUrl={baseUrl}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4} justify="flex-end" alignItems="center">
                    <Grid item xs={2} container justify="flex-end" alignItems="center">
                        <Button
                            // disabled={!filtersUpdated}
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={() => this.onSearch()}
                        >
                            <Search className={classes.buttonIcon} />
                            <FormattedMessage id="iaso.search" defaultMessage="Search" />
                        </Button>
                    </Grid>
                </Grid>
            </Fragment>
        );
    }
}
OrgUnitsFiltersComponent.defaultProps = {
    baseUrl: '',
};

OrgUnitsFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sources: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(injectIntl(OrgUnitsFiltersComponent)));
