import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';


import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Search from '@material-ui/icons/Search';

import commonStyles from '../../../styles/common';

import {
    orgUnitType,
    location,
    device,
    deviceOwnership,
    periods,
    instanceStatus,
} from '../../../constants/filters';
import FiltersComponent from '../../../components/filters/FiltersComponent';
import { createUrl } from '../../../../../utils/fetchData';
import OrgUnitsLevelsFiltersComponent from '../../orgUnits/components/OrgUnitsLevelsFiltersComponent';
import OrgUnitSearch from '../../orgUnits/components/OrgUnitSearch';
import { getOrgUnitParentsIds } from '../../orgUnits/utils';


import { INSTANCE_STATUSES } from '../constants';
import { setInstancesFilterUpdated as setInstancesFilterAction } from '../actions';

export const instanceStatusOptions = INSTANCE_STATUSES.map(status => (
    {
        value: status,
        label: {
            id: `iaso.label.instanceStatus.${status.toLowerCase()}`,
            defaultMessage: status,
        },
    }
));

const styles = theme => ({
    ...commonStyles(theme),
});

class InstancesFiltersComponent extends Component {
    onSearch() {
        const {
            isInstancesFilterUpdated,
            setInstancesFilterUpdated,
        } = this.props;

        if (isInstancesFilterUpdated) {
            setInstancesFilterUpdated(false);
            const tempParams = {
                ...this.props.params,
            };
            tempParams.page = 1;
            this.props.redirectTo(this.props.baseUrl, tempParams);
        }
        this.props.onSearch();
    }

    onSelectOrgUnit(orgUnit) {
        const {
            redirectTo,
            params,
            baseUrl,
            setInstancesFilterUpdated,
        } = this.props;
        const parentIds = getOrgUnitParentsIds(orgUnit);
        parentIds.push(orgUnit.id);
        const tempParams = {
            ...params,
            levels: parentIds.join(','),
        };

        setInstancesFilterUpdated(true);
        redirectTo(baseUrl, tempParams);
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
            periodsList,
            isInstancesFilterUpdated,
            setInstancesFilterUpdated,
        } = this.props;


        return (
            <div className={classes.marginBottomBig}>
                <Grid container spacing={4}>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => setInstancesFilterUpdated(true)}
                            filters={[
                                periods(periodsList),
                                location(formatMessage),
                                orgUnitType(orgUnitTypes),
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => setInstancesFilterUpdated(true)}
                            filters={[
                                instanceStatus(instanceStatusOptions),
                                device(devices),
                                deviceOwnership(devicesOwnerships),
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <OrgUnitSearch onSelectOrgUnit={ou => this.onSelectOrgUnit(ou)} />
                        <OrgUnitsLevelsFiltersComponent
                            onLatestIdChanged={() => setInstancesFilterUpdated(true)}
                            params={params}
                            baseUrl={baseUrl}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4} justify="flex-end" alignItems="center">
                    <Grid item xs={2} container justify="flex-end" alignItems="center">
                        <Button
                            disabled={!isInstancesFilterUpdated}
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
    periodsList: PropTypes.array.isRequired,
    isInstancesFilterUpdated: PropTypes.bool.isRequired,
    setInstancesFilterUpdated: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    devices: state.devices.list,
    devicesOwnerships: state.devices.ownershipList,
    periodsList: state.periods.list,
    isInstancesFilterUpdated: state.instances.isInstancesFilterUpdated,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setInstancesFilterUpdated: isInstancesFilterUpdated => dispatch(setInstancesFilterAction(isInstancesFilterUpdated)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(injectIntl(InstancesFiltersComponent)));
