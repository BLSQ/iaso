// To stay consistent with the naming convention, this component is named FormForm such as OrgUnitForm ...

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { Grid, makeStyles, Box, Typography } from '@material-ui/core';

import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';

import { periodTypeOptions } from '../../periods/constants';
import {
    commaSeparatedIdsToArray,
    commaSeparatedIdsToStringArray,
} from '../../../utils/forms';

import MESSAGES from '../messages';

const styles = theme => ({
    radio: {
        flexDirection: 'row',
    },
    advancedSettings: {
        color: theme.palette.primary.main,
        alignSelf: 'center',
        textAlign: 'right',
        flex: '1',
    },
});

const useStyles = makeStyles(styles);
const formatBooleanForRadio = value => {
    if (value === true) return 'true';
    if (value === false) return 'false';
    return null;
};

const FormForm = ({ currentForm, setFieldValue }) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const [showAdvancedSettings, setshowAdvancedSettings] = useState(false);
    const allProjects = useSelector(state => state.projects.allProjects);
    const allOrgUnitTypes = useSelector(state => state.orgUnitsTypes.allTypes);
    const setPeriodType = value => {
        setFieldValue('period_type', value);
        if (value === null) {
            setFieldValue('single_per_period', null);
            setFieldValue('periods_before_allowed', 0);
            setFieldValue('periods_after_allowed', 0);
        } else {
            setFieldValue('periods_before_allowed', 3);
            setFieldValue('periods_after_allowed', 3);
        }
    };
    let orgUnitTypes;
    if (currentForm.org_unit_type_ids.value.length > 0) {
        orgUnitTypes = currentForm.org_unit_type_ids.value.join(',');
    }
    let projects;
    if (currentForm.project_ids.value.length > 0) {
        projects = currentForm.project_ids.value.join(',');
    }

    return (
        <Grid container spacing={2} justifyContent="flex-start">
            <Grid xs={6} item>
                <InputComponent
                    keyValue="name"
                    onChange={(key, value) => setFieldValue(key, value)}
                    value={currentForm.name.value}
                    errors={currentForm.name.errors}
                    type="text"
                    label={MESSAGES.name}
                    required
                />
                <InputComponent
                    keyValue="period_type"
                    clearable
                    onChange={(key, value) => setPeriodType(value)}
                    value={currentForm.period_type.value}
                    errors={currentForm.period_type.errors}
                    type="select"
                    options={periodTypeOptions}
                    label={MESSAGES.periodType}
                />
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <InputComponent
                            keyValue="periods_before_allowed"
                            disabled={currentForm.period_type.value === null}
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.periods_before_allowed.value}
                            errors={currentForm.periods_before_allowed.errors}
                            type="number"
                            label={MESSAGES.periodsBeforeAllowed}
                            required
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <InputComponent
                            keyValue="periods_after_allowed"
                            disabled={currentForm.period_type.value === null}
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.periods_after_allowed.value}
                            errors={currentForm.periods_after_allowed.errors}
                            type="number"
                            label={MESSAGES.periodsAfterAllowed}
                            required
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <InputComponent
                            className={classes.radio}
                            keyValue="single_per_period"
                            name="single_per_period"
                            disabled={currentForm.period_type.value === null}
                            required
                            onChange={(key, value) => {
                                setFieldValue(key, value === 'true');
                            }}
                            value={formatBooleanForRadio(
                                currentForm.single_per_period.value,
                            )}
                            errors={
                                currentForm.single_per_period.value === null
                                    ? [
                                          intl.formatMessage(
                                              MESSAGES.singlePerPeriodSelect,
                                          ),
                                      ]
                                    : []
                            }
                            type="radio"
                            options={[
                                {
                                    label: intl.formatMessage(MESSAGES.yes),
                                    value: 'true',
                                },
                                {
                                    label: intl.formatMessage(MESSAGES.no),
                                    value: 'false',
                                },
                            ]}
                            clearable={false}
                            label={MESSAGES.singlePerPeriod}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid xs={6} item>
                <InputComponent
                    multi
                    clearable
                    keyValue="project_ids"
                    onChange={(key, value) =>
                        setFieldValue(key, commaSeparatedIdsToArray(value))
                    }
                    value={projects}
                    errors={currentForm.project_ids.errors}
                    type="select"
                    options={
                        allProjects
                            ? allProjects.map(p => ({
                                  label: p.name,
                                  value: p.id,
                              }))
                            : []
                    }
                    label={MESSAGES.projects}
                    required
                />
                <InputComponent
                    multi
                    clearable
                    keyValue="org_unit_type_ids"
                    onChange={(key, value) =>
                        setFieldValue(key, commaSeparatedIdsToArray(value))
                    }
                    value={orgUnitTypes}
                    errors={currentForm.org_unit_type_ids.errors}
                    type="select"
                    options={
                        allOrgUnitTypes
                            ? allOrgUnitTypes.map(o => ({
                                  label: o.name,
                                  value: o.id,
                              }))
                            : []
                    }
                    label={MESSAGES.orgUnitsTypes}
                />
                {showAdvancedSettings && (
                    <>
                        <InputComponent
                            keyValue="device_field"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.device_field.value}
                            errors={currentForm.device_field.errors}
                            type="text"
                            label={MESSAGES.deviceField}
                        />
                        <InputComponent
                            keyValue="location_field"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.location_field.value}
                            errors={currentForm.location_field.errors}
                            type="text"
                            label={MESSAGES.locationField}
                        />
                        <InputComponent
                            multi
                            clearable
                            keyValue="label_keys"
                            onChange={(key, value) => {
                                setFieldValue(
                                    key,
                                    commaSeparatedIdsToStringArray(value),
                                );
                            }}
                            value={currentForm.label_keys.value}
                            errors={currentForm.possible_fields.errors}
                            type="select"
                            options={currentForm.possible_fields.value
                                .map(field => ({
                                    label: field.label.trim() // some labels are just an empty space
                                        ? field.label
                                        : field.name,
                                    value: field.name,
                                }))
                                .sort(
                                    (option1, option2) =>
                                        option1.label > option2.label,
                                )}
                            label={MESSAGES.fields}
                        />
                        <Box style={{ display: 'inline-flex', width: '100%' }}>
                            <InputComponent
                                keyValue="derived"
                                onChange={(key, value) =>
                                    setFieldValue(key, value)
                                }
                                value={currentForm.derived.value}
                                errors={currentForm.derived.errors}
                                type="checkbox"
                                required
                                label={MESSAGES.derived}
                            />
                            {/* Splitting the Typography to be able to align it with the checkbox */}
                            <Typography
                                className={classes.advancedSettings}
                                variant="overline"
                                onClick={() => setshowAdvancedSettings(false)}
                            >
                                {intl.formatMessage(
                                    MESSAGES.hideAdvancedSettings,
                                )}
                            </Typography>
                        </Box>
                    </>
                )}
                {!showAdvancedSettings && (
                    <Typography
                        className={classes.advancedSettings}
                        variant="overline"
                        onClick={() => setshowAdvancedSettings(true)}
                    >
                        {intl.formatMessage(MESSAGES.showAdvancedSettings)}
                    </Typography>
                )}
            </Grid>
        </Grid>
    );
};

FormForm.propTypes = {
    currentForm: PropTypes.object.isRequired,
    setFieldValue: PropTypes.func.isRequired,
};

export default FormForm;
