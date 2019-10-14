import React, { Component } from 'react';
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
    orgUnitType,
    location,
    device,
    deviceOwnership,
} from '../../constants/filters';

import FiltersComponent from './FiltersComponent';
import { createUrl } from '../../../../utils/fetchData';
import OrgUnitsLevelsFiltersComponent from './OrgUnitsLevelsFiltersComponent';

const styles = theme => ({
    ...commonStyles(theme),
});

class InstancesFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersUpdated: false,
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
            devices,
            devicesOwnerships,
        } = this.props;
        const { filtersUpdated } = this.state;
        return (
            <div className={classes.marginBottomBig}>
                <Grid container spacing={4}>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                location(formatMessage),
                                orgUnitType(orgUnitTypes),
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                device(devices),
                                deviceOwnership(devicesOwnerships),
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
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
                            disabled={!filtersUpdated}
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
            </div>
        );
    }
}
InstancesFiltersComponent.defaultProps = {
    baseUrl: '',
};

InstancesFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    devices: PropTypes.array.isRequired,
    devicesOwnerships: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    devices: state.devices.list,
    devicesOwnerships: state.devices.ownershipList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(injectIntl(InstancesFiltersComponent)));
