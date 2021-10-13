import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { Button, makeStyles, Box, Grid } from '@material-ui/core';

import Search from '@material-ui/icons/Search';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import FiltersComponent from '../../../components/filters/FiltersComponent';

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
import DatesRange from '../../../components/filters/DatesRange';

import { INSTANCE_STATUSES } from '../constants';
import { setInstancesFilterUpdated } from '../actions';
import { redirectTo, redirectToReplace } from '../../../routing/actions';

import { useInstancesFiltersData } from '../hooks';

import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

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

// TODO make better track of changes (search button activates too easily)
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
    useInstancesFiltersData(
        periodsList,
        formId,
        setFetchingOrgUnitTypes,
        setFetchingDevices,
        setFetchingDevicesOwnerships,
        setFetchingPeriodsList,
    );
    console.log('periodsList', periodsList);
    if (periodsList.length > 0) {
        secondColumnFilters.unshift({
            ...periods(periodsList, intl.formatMessage),
            loading: fetchingPeriodsList,
        });
    }

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

    const onSelectOrgUnitFromTree = orgUnit => {
        if (orgUnit) {
            const tempParams = { ...params, levels: [orgUnit.id] };
            dispatch(redirectTo(baseUrl, tempParams));
            dispatch(setInstancesFilterUpdated(true));
        } else {
            const noLevels = { ...params };
            delete noLevels.levels;
            dispatch(redirectTo(baseUrl, noLevels));
            if (params.levels) {
                dispatch(setInstancesFilterUpdated(true));
            }
        }
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
                            <Box>
                                <OrgUnitTreeviewModal
                                    toggleOnLabelClick={false}
                                    titleMessage={MESSAGES.search}
                                    onConfirm={orgUnitId => {
                                        onSelectOrgUnitFromTree(orgUnitId);
                                    }}
                                />
                            </Box>
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
