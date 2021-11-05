import React, { useState, useCallback } from 'react';
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
    instanceStatus,
    instanceDeleted,
    useFormatPeriodFilter,
    forms,
} from '../../../constants/filters';
import DatesRange from '../../../components/filters/DatesRange';

import { INSTANCE_STATUSES } from '../constants';
import { setInstancesFilterUpdated } from '../actions';

import { useInstancesFiltersData, useGetForms } from '../hooks';
import { getValues, useFormState } from '../../../hooks/form';

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
    params: { formIds },
    params,
    onSearch,
    baseUrl,
}) => {
    const intl = useSafeIntl();
    const dispatch = useDispatch();
    const classes = useStyles();
    const formatPeriodFilter = useFormatPeriodFilter();

    const [fetchingOrgUnitTypes, setFetchingOrgUnitTypes] = useState(false);
    const [fetchingPeriodsList, setFetchingPeriodsList] = useState(false);
    const [fetchingDevices, setFetchingDevices] = useState(false);
    const [fetchingDevicesOwnerships, setFetchingDevicesOwnerships] =
        useState(false);

    const [formState, setFormState] = useFormState(params);

    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const periodsList = useSelector(state => state.periods.list);
    const devices = useSelector(state => state.devices.list);
    const devicesOwnerships = useSelector(state => state.devices.ownershipList);
    const isInstancesFilterUpdated = useSelector(
        state => state.instances.isInstancesFilterUpdated,
    );

    const searchParams = [{ search: params.search }];

    const { data, isFetching: fetchingForms } = useGetForms();
    const formsList = (data && data.forms) || [];

    const secondColumnFilters = [
        {
            ...forms(formsList),
            loading: fetchingForms,
        },
        location(intl.formatMessage),
        {
            ...orgUnitType(orgUnitTypes),
            loading: fetchingOrgUnitTypes,
        },
        instanceDeleted(),
    ];
    useInstancesFiltersData(
        periodsList,
        formIds,
        setFetchingOrgUnitTypes,
        setFetchingDevices,
        setFetchingDevicesOwnerships,
        setFetchingPeriodsList,
    );

    if (periodsList.length > 0) {
        secondColumnFilters.unshift({
            ...formatPeriodFilter(periodsList),
            loading: fetchingPeriodsList,
        });
    }

    const getFilterParams = filterKeys => {
        const newParams = {};
        filterKeys.forEach(fk => {
            const newValue = formState[fk]?.value;
            if (newValue) {
                newParams[fk] = newValue;
            }
        });
        return newParams;
    };

    const handleSearch = () => {
        if (isInstancesFilterUpdated) {
            dispatch(setInstancesFilterUpdated(false));
            onSearch({
                ...params,
                ...getValues(formState),
                page: 1,
            });
        }
    };

    const handleFormChange = useCallback(
        (value, key) => {
            // checking only as value can be null or false
            if (key) {
                setFormState(key, value);
            }
            dispatch(setInstancesFilterUpdated(true));
        },
        [setFormState, dispatch],
    );

    return (
        <div className={classes.marginBottomBig}>
            <Grid container spacing={4}>
                <Grid item xs={8}>
                    <Grid container item xs={12}>
                        <DatesRange
                            onChangeDate={(key, value) =>
                                handleFormChange(value, key)
                            }
                            dateFrom={formState.dateFrom?.value}
                            dateTo={formState.dateTo?.value}
                        />
                    </Grid>
                    <Grid container spacing={4}>
                        <Grid item xs={6}>
                            <FiltersComponent
                                params={getFilterParams([
                                    'formIds',
                                    'withLocation',
                                    'orgUnitTypeId',
                                    'periods',
                                    'showDeleted',
                                ])}
                                redirectOnChange={false}
                                onFilterChanged={handleFormChange}
                                filters={secondColumnFilters}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FiltersComponent
                                params={getFilterParams([
                                    'status',
                                    'deviceId',
                                    'deviceOwnershipId',
                                ])}
                                baseUrl={baseUrl}
                                redirectOnChange={false}
                                onFilterChanged={handleFormChange}
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
                            <Box>
                                <OrgUnitTreeviewModal
                                    toggleOnLabelClick={false}
                                    titleMessage={MESSAGES.search}
                                    onConfirm={orgUnit =>
                                        handleFormChange(
                                            orgUnit ? [orgUnit.id] : undefined,
                                            'levels',
                                        )
                                    }
                                />
                            </Box>
                            <FiltersComponent
                                params={getFilterParams(['search'])}
                                redirectOnChange={false}
                                onFilterChanged={handleFormChange}
                                filters={[
                                    extendFilter(
                                        searchParams,
                                        search(),
                                        (value, urlKey) =>
                                            handleFormChange(value, urlKey),
                                    ),
                                ]}
                                onEnterPressed={() => handleSearch()}
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
