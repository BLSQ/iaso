import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';


import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

import commonStyles from '../../styles/common';

import {
    search,
    status,
    orgUnitType,
    source,
    shape,
    location,
} from '../../constants/orgUnitsFilters';

import FiltersComponent from './FiltersComponent';
import { createUrl } from '../../../../utils/fetchData';

const styles = theme => ({
    ...commonStyles(theme),
    whiteContainer: {
        ...commonStyles(theme).whiteContainer,
        padding: theme.spacing(4),
    },
});

class OrgUnitsFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersUpdated: false,
        };
    }

    onFilterChanged() {
        console.log('onFilterChanged');
        this.setState({
            filtersUpdated: true,
        });
    }

    onSearch() {
        console.log('this.state.filtersUpdated', this.state.filtersUpdated);
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
            sourceTypes,
        } = this.props;
        return (
            <Container maxWidth={false} className={classes.whiteContainer}>
                <Grid container spacing={4}>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                search(),
                                source(formatMessage, sourceTypes),
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
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                status(formatMessage),
                                orgUnitType(formatMessage, orgUnitTypes),
                            ]}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={1} justify="flex-end" alignItems="center">
                    <Grid item xs={2} container justify="flex-end" alignItems="center">
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={() => this.onSearch()}
                        >
                            <FormattedMessage id="iaso.search" defaultMessage="Search" />
                        </Button>
                    </Grid>
                </Grid>
            </Container>
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
    sourceTypes: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(injectIntl(OrgUnitsFiltersComponent)));
