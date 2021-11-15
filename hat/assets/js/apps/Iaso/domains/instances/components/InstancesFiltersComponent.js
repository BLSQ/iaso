import React, { useState, useCallback, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { Button, makeStyles, Grid, Box, Typography } from '@material-ui/core';

import Search from '@material-ui/icons/Search';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';

import { periodTypeOptions } from '../../periods/constants';
import getDisplayName from '../../../utils/usersUtils';
import DatesRange from '../../../components/filters/DatesRange';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { Period } from '../../periods/models';

import { INSTANCE_STATUSES } from '../constants';
import { setInstancesFilterUpdated } from '../actions';

import { useInstancesFiltersData, useGetForms } from '../hooks';
import { getInstancesFilterValues, useFormState } from '../../../hooks/form';

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
    const { formatMessage } = useSafeIntl();
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
    const formsList = (data && data.forms) || [];
    useInstancesFiltersData(
        formIds,
        setFetchingOrgUnitTypes,
        setFetchingDevices,
        setFetchingDevicesOwnerships,
    );
    const handleSearch = useCallback(() => {
        if (isInstancesFilterUpdated) {
            dispatch(setInstancesFilterUpdated(false));
            onSearch({
                ...params,
                ...getInstancesFilterValues(formState),
                page: 1,
            });
        }
    }, [params, onSearch, dispatch, formState, isInstancesFilterUpdated]);

    const handleFormChange = useCallback(
        (key, value) => {
            // checking only as value can be null or false
            if (key) {
                setFormState(key, value);
                if (key === 'periodType') {
                    setFormState('startPeriod', undefined);
                    setFormState('endPeriod', undefined);
                }
            }
            dispatch(setInstancesFilterUpdated(true));
        },
        [setFormState, dispatch],
    );
    const periodError = useMemo(() => {
        if (formState.startPeriod?.value && formState.endPeriod?.value) {
            return !Period.isBefore(
                formState.startPeriod.value,
                formState.endPeriod.value,
            );
        }
        return false;
    }, [formState.startPeriod?.value, formState.endPeriod?.value]);
    return (
        <div className={classes.marginBottomBig}>
            <Grid container spacing={4}>
                <Grid item xs={4}>
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
                        keyValue="mapResults"
                        onChange={handleFormChange}
                        value={formState.mapResults.value || null}
                        type="number"
                        label={MESSAGES.locationLimit}
                    />
                </Grid>
                <Grid item xs={4}>
                    <InputComponent
                        keyValue="status"
                        clearable
                        onChange={handleFormChange}
                        value={formState.status.value || null}
                        type="select"
                        options={instanceStatusOptions}
                        label={MESSAGES.exportStatus}
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
                <Grid item xs={4}>
                    <DatesRange
                        xs={12}
                        sm={12}
                        md={12}
                        lg={6}
                        onChangeDate={handleFormChange}
                        dateFrom={formState.dateFrom?.value}
                        dateTo={formState.dateTo?.value}
                        labelFrom={MESSAGES.creationDateFrom}
                        labelTo={MESSAGES.creationDateTo}
                    />
                    <InputComponent
                        keyValue="periodType"
                        clearable
                        onChange={handleFormChange}
                        value={formState.periodType.value}
                        type="select"
                        options={periodTypeOptions}
                        label={MESSAGES.periodType}
                    />
                    {formState.periodType.value && (
                        <>
                            <PeriodPicker
                                hasError={periodError}
                                activePeriodString={formState.startPeriod.value}
                                periodType={formState.periodType.value}
                                title={formatMessage(MESSAGES.startPeriod)}
                                onChange={startPeriod =>
                                    handleFormChange('startPeriod', startPeriod)
                                }
                            />

                            <PeriodPicker
                                hasError={periodError}
                                activePeriodString={formState.endPeriod.value}
                                periodType={formState.periodType.value}
                                title={formatMessage(MESSAGES.endPeriod)}
                                onChange={endPeriod =>
                                    handleFormChange('endPeriod', endPeriod)
                                }
                            />
                            {periodError && (
                                <Box mt={-1}>
                                    <Typography
                                        variant="body1"
                                        color="error"
                                        fontSize="small"
                                    >
                                        {formatMessage(MESSAGES.periodError)}
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
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
                        disabled={!isInstancesFilterUpdated || periodError}
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
