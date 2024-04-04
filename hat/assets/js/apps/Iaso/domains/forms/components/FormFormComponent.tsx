/* eslint-disable camelcase */
import React, { useState, FunctionComponent, useEffect } from 'react';
import { Box, Grid, Typography, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import { Link } from 'react-router';

import { History, FormatListBulleted } from '@mui/icons-material';
import { baseUrls } from '../../../constants/urls';
import InputComponent from '../../../components/forms/InputComponent';
import {
    commaSeparatedIdsToArray,
    commaSeparatedIdsToStringArray,
} from '../../../utils/forms';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { formatLabel } from '../../instances/utils';
import {
    NO_PERIOD,
    periodTypeOptionsWithNoPeriod,
} from '../../periods/constants';
import MESSAGES from '../messages';
import { DisplayIfUserHasPerm } from '../../../components/DisplayIfUserHasPerm';
import { FormDataType } from '../types/forms';
import { FormLegendInput } from './FormLegendInput';

const useStyles = makeStyles((theme: Theme) => ({
    radio: {
        flexDirection: 'row',
    },
    advancedSettings: {
        color: theme.palette.primary.main,
        alignSelf: 'center',
        textAlign: 'right',
        flex: '1',
        cursor: 'pointer',
    },
    linkWithIcon: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5em',
    },
}));

const formatBooleanForRadio = value => {
    if (value === true) return 'true';
    if (value === false) return 'false';
    return null;
};

type FormFormProps = {
    currentForm: FormDataType;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: any) => void;
};

const FormForm: FunctionComponent<FormFormProps> = ({
    currentForm,
    setFieldValue,
}) => {
    const classes = useStyles();
    const [displayPeriods, setDisplayPeriods] = useState<boolean>();

    const { formatMessage } = useSafeIntl();
    const [showAdvancedSettings, setshowAdvancedSettings] = useState(false);

    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const { data: allOrgUnitTypes, isFetching: isOuTypeLoading } =
        useGetOrgUnitTypesDropdownOptions();
    const setPeriodType = value => {
        setFieldValue('period_type', value);
        if (value === null || value === NO_PERIOD) {
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

    useEffect(() => {
        if (
            currentForm.period_type.value === NO_PERIOD ||
            currentForm.period_type.value === undefined ||
            currentForm.period_type.value === null
        ) {
            setDisplayPeriods(false);
        } else {
            setDisplayPeriods(true);
        }
    }, [currentForm.period_type.value]);
    const logsUrl = `/${baseUrls.apiLogs}/?objectId=${currentForm.id.value}&contentType=iaso.form`;
    return (
        <>
            <Grid container spacing={2} justifyContent="flex-start">
                <Grid xs={6} item>
                    {/* Splitting the Typography to be able to align it with the checkbox */}

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
                        value={
                            currentForm.period_type.value
                                ? currentForm.period_type.value
                                : NO_PERIOD
                        }
                        errors={currentForm.period_type.errors}
                        type="select"
                        options={periodTypeOptionsWithNoPeriod}
                        label={MESSAGES.periodType}
                    />

                    <Grid container spacing={2}>
                        {displayPeriods && (
                            <>
                                <Grid item xs={6}>
                                    <InputComponent
                                        keyValue="periods_before_allowed"
                                        disabled={
                                            currentForm.period_type.value ===
                                            null
                                        }
                                        onChange={(key, value) =>
                                            setFieldValue(key, value)
                                        }
                                        value={
                                            currentForm.periods_before_allowed
                                                .value
                                        }
                                        errors={
                                            currentForm.periods_before_allowed
                                                .errors
                                        }
                                        type="number"
                                        label={MESSAGES.periodsBeforeAllowed}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <InputComponent
                                        keyValue="periods_after_allowed"
                                        disabled={
                                            currentForm.period_type.value ===
                                            null
                                        }
                                        onChange={(key, value) =>
                                            setFieldValue(key, value)
                                        }
                                        value={
                                            currentForm.periods_after_allowed
                                                .value
                                        }
                                        errors={
                                            currentForm.periods_after_allowed
                                                .errors
                                        }
                                        type="number"
                                        label={MESSAGES.periodsAfterAllowed}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <InputComponent
                                        className={classes.radio}
                                        keyValue="single_per_period"
                                        disabled={
                                            currentForm.period_type.value ===
                                            null
                                        }
                                        required
                                        onChange={(key, value) => {
                                            setFieldValue(
                                                key,
                                                value === 'true',
                                            );
                                        }}
                                        value={formatBooleanForRadio(
                                            currentForm.single_per_period.value,
                                        )}
                                        errors={
                                            currentForm.single_per_period
                                                .value === null
                                                ? [
                                                      formatMessage(
                                                          MESSAGES.singlePerPeriodSelect,
                                                      ),
                                                  ]
                                                : []
                                        }
                                        type="radio"
                                        options={[
                                            {
                                                label: formatMessage(
                                                    MESSAGES.yes,
                                                ),
                                                value: 'true',
                                            },
                                            {
                                                label: formatMessage(
                                                    MESSAGES.no,
                                                ),
                                                value: 'false',
                                            },
                                        ]}
                                        clearable={false}
                                        label={MESSAGES.singlePerPeriod}
                                        withMarginTop={false}
                                    />
                                </Grid>
                            </>
                        )}
                        <Grid item xs={2} />
                        <Grid item xs={displayPeriods ? 4 : 18}>
                            <FormLegendInput
                                currentForm={currentForm}
                                setFieldValue={setFieldValue}
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
                        options={allProjects || []}
                        label={MESSAGES.projects}
                        required
                        loading={isFetchingProjects}
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
                        options={allOrgUnitTypes || []}
                        label={MESSAGES.orgUnitsTypes}
                        loading={isOuTypeLoading}
                    />
                    {showAdvancedSettings && (
                        <>
                            <InputComponent
                                keyValue="device_field"
                                onChange={(key, value) =>
                                    setFieldValue(key, value)
                                }
                                value={currentForm.device_field.value}
                                errors={currentForm.device_field.errors}
                                type="text"
                                label={MESSAGES.deviceField}
                            />
                            <InputComponent
                                keyValue="location_field"
                                onChange={(key, value) =>
                                    setFieldValue(key, value)
                                }
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
                                        label: formatLabel(field),
                                        value: field.name,
                                    }))
                                    .sort((option1, option2) =>
                                        option1.label.localeCompare(
                                            option2.label,
                                        ),
                                    )}
                                label={MESSAGES.fields}
                            />
                            <Box
                                style={{
                                    display: 'inline-flex',
                                    width: '100%',
                                }}
                            >
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
                                    onClick={() =>
                                        setshowAdvancedSettings(false)
                                    }
                                >
                                    {formatMessage(
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
                            {formatMessage(MESSAGES.showAdvancedSettings)}
                        </Typography>
                    )}
                </Grid>
            </Grid>
            {currentForm.id.value && (
                <Grid justifyContent="flex-end" container spacing={2}>
                    <DisplayIfUserHasPerm permission="iaso_submissions">
                        <Grid item>
                            <Link
                                className={classes.linkWithIcon}
                                href={`/dashboard/forms/submissions/formIds/${currentForm.id.value}/tab/list`}
                            >
                                <FormatListBulleted />
                                {formatMessage(MESSAGES.records)}
                            </Link>
                        </Grid>
                    </DisplayIfUserHasPerm>
                    <Grid item>
                        <Link href={logsUrl} className={classes.linkWithIcon}>
                            <History />
                            {formatMessage(MESSAGES.formChangeLog)}
                        </Link>
                    </Grid>
                </Grid>
            )}
        </>
    );
};

export default FormForm;
