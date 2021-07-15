import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { Button, makeStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';

import Search from '@material-ui/icons/Search';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import {
    search,
    orgUnitType,
    location,
    device,
    deviceOwnership,
    periods,
    instanceStatus,
    instanceDeleted,
} from '../../../constants/filters';

import {
    fetchOrgUnitsTypes,
    fetchDevices,
    fetchDevicesOwnerships,
    fetchPeriods,
} from '../../../utils/requests';
import FiltersComponent from '../../../components/filters/FiltersComponent';
import DatesRange from '../../../components/filters/DatesRange';

import OrgUnitsLevelsFiltersComponent from '../../orgUnits/components/OrgUnitsLevelsFiltersComponent';
import OrgUnitSearch from '../../orgUnits/components/OrgUnitSearch';
import { getOrgUnitParentsIds } from '../../orgUnits/utils';

import { INSTANCE_STATUSES } from '../constants';
import { setInstancesFilterUpdated } from '../actions';
import { redirectTo, redirectToReplace } from '../../../routing/actions';
import { setOrgUnitTypes } from '../../orgUnits/actions';
import {
    setDevicesList,
    setDevicesOwnershipList,
} from '../../../redux/devicesReducer';
import { setPeriods } from '../../periods/actions';

import MESSAGES from '../messages';

export const instanceStatusOptions = INSTANCE_STATUSES.map(status => ({
    value: status,
    label: MESSAGES[status.toLowerCase()],
}));

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const extendFilter = (searchParams, filter, onChange) => ({
    // should be moved from here to a common location
    ...filter,
    uid: `${filter.urlKey}`,
    value: searchParams[filter.urlKey],
    callback: (value, urlKey) => onChange(value, urlKey),
});

const InstancesFiltersComponent = ({
    params: { formId },
    params,
    onSearch,
    baseUrl,
}) => {
    const intl = useSafeIntl();
    const dispatch = useDispatch();
    const classes = useStyles();

    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const [fetchingOrgUnitTypes, setFetchingOrgUnitTypes] = useState(false);
    const periodsList = useSelector(state => state.periods.list);
    const [fetchingPeriodsList, setFetchingPeriodsList] = useState(false);
    const devices = useSelector(state => state.devices.list);
    const [fetchingDevices, setFetchingDevices] = useState(false);
    const devicesOwnerships = useSelector(state => state.devices.ownershipList);
    const [fetchingDevicesOwnerships, setFetchingDevicesOwnerships] =
        useState(false);

    const isInstancesFilterUpdated = useSelector(
        state => state.instances.isInstancesFilterUpdated,
    );
    const searchParams = [{ search: params.search }];
    const secondColumnFilters = [
        location(intl.formatMessage),
        {
            ...orgUnitType(orgUnitTypes),
            loading: fetchingOrgUnitTypes,
        },
        instanceDeleted(),
    ];
    if (periodsList.length > 0) {
        secondColumnFilters.unshift({
            ...periods(periodsList),
            loading: fetchingPeriodsList,
        });
    }

    useEffect(() => {
        setFetchingOrgUnitTypes(true);
        fetchOrgUnitsTypes(dispatch).then(newOrgUnitTypes => {
            setFetchingOrgUnitTypes(false);
            dispatch(setOrgUnitTypes(newOrgUnitTypes));
        });
        setFetchingDevices(true);
        fetchDevices(dispatch).then(newDevices => {
            setFetchingDevices(false);
            dispatch(setDevicesList(newDevices));
        });
        setFetchingDevicesOwnerships(true);
        fetchDevicesOwnerships(dispatch).then(devicesOwnershipsList => {
            setFetchingDevicesOwnerships(false);
            dispatch(setDevicesOwnershipList(devicesOwnershipsList));
        });
        setFetchingPeriodsList(true);
        fetchPeriods(dispatch, formId).then(newPeriods => {
            setFetchingPeriodsList(false);
            dispatch(setPeriods(newPeriods));
        });
    }, []);

    const handleSearch = () => {
        if (isInstancesFilterUpdated) {
            dispatch(setInstancesFilterUpdated(false));
            const tempParams = {
                ...params,
            };
            tempParams.page = 1;
            dispatch(redirectToReplace(baseUrl, tempParams));
        }
        onSearch();
    };

    const onSelectOrgUnit = orgUnit => {
        const parentIds = getOrgUnitParentsIds(orgUnit);
        parentIds.push(orgUnit.id);
        const tempParams = {
            ...params,
            levels: parentIds.join(','),
        };

        dispatch(redirectTo(baseUrl, tempParams));
        dispatch(setInstancesFilterUpdated(true));
    };

    const onChange = (value, urlKey) => {
        dispatch(setInstancesFilterUpdated(true));

        const tempParams = {
            ...params,
            [urlKey]: value,
        };

        dispatch(redirectToReplace(baseUrl, tempParams));
    };
    return (
        <div className={classes.marginBottomBig}>
            <Grid container spacing={4}>
                <Grid item xs={8}>
                    <Grid container item xs={12}>
                        <DatesRange
                            onChangeDate={(key, value) => onChange(value, key)}
                            dateFrom={params.dateFrom}
                            dateTo={params.dateTo}
                        />
                    </Grid>
                    <Grid container spacing={4}>
                        <Grid item xs={6}>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                onFilterChanged={() =>
                                    dispatch(setInstancesFilterUpdated(true))
                                }
                                filters={secondColumnFilters}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                onFilterChanged={() =>
                                    dispatch(setInstancesFilterUpdated(true))
                                }
                                filters={[
                                    instanceStatus(instanceStatusOptions),
                                    {
                                        ...device(devices),
                                        loading: fetchingDevices,
                                    },
                                    {
                                        ...deviceOwnership(devicesOwnerships),
                                        loading: fetchingDevicesOwnerships,
                                    },
                                ]}
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={4}>
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                onFilterChanged={() =>
                                    dispatch(setInstancesFilterUpdated(true))
                                }
                                filters={[
                                    extendFilter(
                                        searchParams,
                                        search(),
                                        (value, urlKey) =>
                                            onChange(value, urlKey),
                                    ),
                                ]}
                                onEnterPressed={() => handleSearch()}
                            />
                            <OrgUnitSearch
                                onSelectOrgUnit={ou => onSelectOrgUnit(ou)}
                            />
                            <OrgUnitsLevelsFiltersComponent
                                onLatestIdChanged={() =>
                                    dispatch(setInstancesFilterUpdated(true))
                                }
                                defaultVersion
                                params={params}
                                baseUrl={baseUrl}
                            />
                        </Grid>
                    </Grid>
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
                        disabled={!isInstancesFilterUpdated}
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <Search className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.search} />
                    </Button>
                </Grid>
            </Grid>
        </div>
    );
};
InstancesFiltersComponent.defaultProps = {
    baseUrl: '',
};

InstancesFiltersComponent.propTypes = {
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
};

export default InstancesFiltersComponent;
