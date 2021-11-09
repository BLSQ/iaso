import React, { useState, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { Button, makeStyles, Grid, Box } from '@material-ui/core';

import Search from '@material-ui/icons/Search';
import { commonStyles } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';

import { periodTypeOptions } from '../../periods/constants';
import getDisplayName from '../../../utils/usersUtils';
import DatesRange from '../../../components/filters/DatesRange';

import { INSTANCE_STATUSES } from '../constants';
import { setInstancesFilterUpdated } from '../actions';

import { useInstancesFiltersData, useGetForms, useGetPeriods } from '../hooks';
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

const InstancesFiltersComponent = ({
    params: { formIds },
    params,
    onSearch,
}) => {
    const dispatch = useDispatch();
    const classes = useStyles();

    const [fetchingOrgUnitTypes, setFetchingOrgUnitTypes] = useState(false);
    const [fetchingDevices, setFetchingDevices] = useState(false);
    const [fetchingDevicesOwnerships, setFetchingDevicesOwnerships] =
        useState(false);

    const [formState, setFormState] = useFormState(params);

    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const devices = useSelector(state => state.devices.list);
    const devicesOwnerships = useSelector(state => state.devices.ownershipList);
    const isInstancesFilterUpdated = useSelector(
        state => state.instances.isInstancesFilterUpdated,
    );

    const { data, isFetching: fetchingForms } = useGetForms();
    const { data: periodsList = [], isFetching: fetchingPeriodsList } =
        useGetPeriods(formIds);
    const formsList = (data && data.forms) || [];
    const disablePeriodPicker =
        (fetchingPeriodsList ||
            (!fetchingPeriodsList && periodsList.length === 0)) &&
        formIds?.split(',').length === 1;
    useInstancesFiltersData(
        formIds,
        setFetchingOrgUnitTypes,
        setFetchingDevices,
        setFetchingDevicesOwnerships,
    );

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
        (key, value) => {
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
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="search"
                        onChange={handleFormChange}
                        value={formState.search.value || null}
                        type="search"
                        label={MESSAGES.textSearch}
                        onEnterPressed={() => handleSearch()}
                    />
                    <InputComponent
                        keyValue="formIds"
                        clearable
                        multi
                        onChange={handleFormChange}
                        value={formState.formIds.value || null}
                        type="select"
                        options={formsList.map(t => ({
                            label: t.name,
                            value: t.id,
                        }))}
                        label={MESSAGES.forms}
                        loading={fetchingForms}
                    />
                    <Box mt={-1}>
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.org_unit}
                            onConfirm={orgUnit =>
                                handleFormChange(
                                    'levels',
                                    orgUnit ? [orgUnit.id] : undefined,
                                )
                            }
                        />
                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="status"
                        clearable
                        onChange={handleFormChange}
                        value={formState.status.value || null}
                        type="select"
                        options={instanceStatusOptions}
                        label={MESSAGES.status}
                    />
                    <InputComponent
                        keyValue="orgUnitTypeId"
                        clearable
                        multi
                        onChange={handleFormChange}
                        value={formState.orgUnitTypeId.value || null}
                        type="select"
                        options={orgUnitTypes.map(t => ({
                            label: t.name,
                            value: t.id,
                        }))}
                        label={MESSAGES.org_unit_type_id}
                        loading={fetchingOrgUnitTypes}
                    />
                    <InputComponent
                        keyValue="withLocation"
                        clearable
                        onChange={handleFormChange}
                        value={formState.withLocation.value || null}
                        type="select"
                        options={instanceStatusOptions}
                        label={MESSAGES.location}
                    />
                </Grid>
                <Grid item xs={3}>
                    <DatesRange
                        spacing={0}
                        xs={12}
                        onChangeDate={handleFormChange}
                        dateFrom={formState.dateFrom?.value}
                        dateTo={formState.dateTo?.value}
                        labelFrom={MESSAGES.creationDateFrom}
                        labelTo={MESSAGES.creationDateTo}
                    />
                    <InputComponent
                        disabled={disablePeriodPicker}
                        keyValue="periodType"
                        clearable
                        onChange={handleFormChange}
                        value={formState.periodType.value}
                        type="select"
                        options={periodTypeOptions}
                        label={MESSAGES.periodType}
                    />
                </Grid>
                <Grid item xs={3}>
                    <InputComponent
                        keyValue="deviceId"
                        clearable
                        onChange={handleFormChange}
                        value={formState.deviceId.value || null}
                        type="select"
                        loading={fetchingDevices}
                        options={devices.map(d => ({
                            label: d.imei,
                            value: d.id,
                        }))}
                        label={MESSAGES.device}
                    />
                    <InputComponent
                        keyValue="deviceOwnershipId"
                        clearable
                        onChange={handleFormChange}
                        value={formState.deviceOwnershipId.value || null}
                        type="select"
                        loading={fetchingDevicesOwnerships}
                        options={devicesOwnerships.map(o => ({
                            label: `${getDisplayName(o.user)} - IMEI:${
                                o.device.imei
                            }`,
                            value: o.id,
                        }))}
                        label={MESSAGES.deviceOwnership}
                    />
                    <InputComponent
                        keyValue="showDeleted"
                        onChange={handleFormChange}
                        value={formState.showDeleted.value}
                        type="checkbox"
                        label={MESSAGES.showDeleted}
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

InstancesFiltersComponent.propTypes = {
    params: PropTypes.object.isRequired,
    onSearch: PropTypes.func.isRequired,
};

export default InstancesFiltersComponent;
