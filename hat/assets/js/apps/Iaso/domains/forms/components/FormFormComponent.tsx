import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { FormatListBulleted, History } from '@mui/icons-material';
import { Box, Grid, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    ExternalLink,
    InputWithInfos,
    LinkWithLocation,
    useSafeIntl,
} from 'bluesquare-components';
import { DisplayIfUserHasPerm } from '../../../components/DisplayIfUserHasPerm';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import {
    commaSeparatedIdsToArray,
    commaSeparatedIdsToStringArray,
} from '../../../utils/forms';
import { SUBMISSIONS, SUBMISSIONS_UPDATE } from '../../../utils/permissions';
import { formatLabel } from '../../instances/utils';
import { useGetOrgUnitTypesDropdownOptions } from '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import {
    NO_PERIOD,
    periodTypeOptionsWithNoPeriod,
} from '../../periods/constants';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import { CR_MODE_NONE, changeRequestModeOptions } from '../constants';
import MESSAGES from '../messages';
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
    setFieldValue: (key: string, value: any) => void;
    originalSinglePerPeriod?: boolean;
};

const FormForm: FunctionComponent<FormFormProps> = ({
    currentForm,
    setFieldValue,
    originalSinglePerPeriod,
}) => {
    const classes = useStyles();
    const [displayPeriods, setDisplayPeriods] = useState<boolean>();
    const { formatMessage } = useSafeIntl();
    const [showAdvancedSettings, setshowAdvancedSettings] = useState(false);
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();
    const setPeriodType = value => {
        let periodTypeValue = value;
        if (value === null || value === NO_PERIOD) {
            periodTypeValue = null;
            setFieldValue('single_per_period', false);
            setFieldValue('periods_before_allowed', 0);
            setFieldValue('periods_after_allowed', 0);
        } else {
            setFieldValue('single_per_period', originalSinglePerPeriod);
            setFieldValue('periods_before_allowed', 3);
            setFieldValue('periods_after_allowed', 3);
        }
        setFieldValue('period_type', periodTypeValue);
    };

    const labelKeysOptions = useMemo(() => {
        return currentForm.possible_fields.value
            .map(field => ({
                label: `${formatLabel(field)} [${field.name}]`,
                value: field.name,
            }))
            .sort((option1, option2) =>
                option1.label.localeCompare(option2.label),
            );
    }, [currentForm.possible_fields.value]);
    let orgUnitTypes;
    if (currentForm.org_unit_type_ids.value.length > 0) {
        orgUnitTypes = currentForm.org_unit_type_ids.value.join(',');
    }
    let projects: number[] = [];
    if (currentForm.project_ids.value.length > 0) {
        projects = currentForm.project_ids.value;
    }
    const { data: allOrgUnitTypes, isFetching: isOuTypeLoading } =
        useGetOrgUnitTypesDropdownOptions({
            projectIds: currentForm.project_ids.value,
            // we only want to fetch the org unit types if the project ids are set, project ids is a required field
            enabled:
                currentForm.project_ids.value &&
                currentForm.project_ids.value.length > 0,
        });
    useEffect(() => {
        if (
            currentForm.period_type.value === NO_PERIOD ||
            !currentForm.period_type.value
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
                        value={currentForm.period_type.value || NO_PERIOD}
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
                                        dataTestId="single_per_period"
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
                        value={projects.join(',')}
                        errors={currentForm.project_ids.errors}
                        type="select"
                        options={allProjects || []}
                        label={MESSAGES.projects}
                        required
                        loading={isFetchingProjects}
                    />
                    <InputWithInfos
                        infos={formatMessage(MESSAGES.projectsInfo)}
                    >
                        <InputComponent
                            multi
                            clearable
                            keyValue="org_unit_type_ids"
                            onChange={(key, value) =>
                                setFieldValue(
                                    key,
                                    commaSeparatedIdsToArray(value),
                                )
                            }
                            value={orgUnitTypes}
                            errors={currentForm.org_unit_type_ids.errors}
                            type="select"
                            options={allOrgUnitTypes || []}
                            label={MESSAGES.orgUnitsTypes}
                            loading={isOuTypeLoading}
                            disabled={
                                !currentForm.project_ids.value ||
                                currentForm.project_ids.value.length === 0
                            }
                        />
                    </InputWithInfos>
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
                                options={labelKeysOptions}
                                label={MESSAGES.fields}
                            />
                            <InputComponent
                                keyValue="change_request_mode"
                                clearable
                                onChange={(key, value) =>
                                    setFieldValue(key, value)
                                }
                                value={
                                    currentForm.change_request_mode.value ||
                                    CR_MODE_NONE
                                }
                                errors={currentForm.change_request_mode.errors}
                                type="select"
                                options={changeRequestModeOptions}
                                label={MESSAGES.changeRequestMode}
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
                    <DisplayIfUserHasPerm
                        permissions={[SUBMISSIONS, SUBMISSIONS_UPDATE]}
                    >
                        <Grid item>
                            <LinkWithLocation
                                className={classes.linkWithIcon}
                                to={`/${baseUrls.instances}/formIds/${currentForm.id.value}/tab/list/isSearchActive/true`}
                            >
                                <FormatListBulleted />
                                {formatMessage(MESSAGES.records)}
                            </LinkWithLocation>
                        </Grid>
                    </DisplayIfUserHasPerm>
                    <Grid item>
                        <ExternalLink url={logsUrl}>
                            <Typography className={classes.linkWithIcon}>
                                <History />
                                {formatMessage(MESSAGES.formChangeLog)}
                            </Typography>
                        </ExternalLink>
                    </Grid>
                </Grid>
            )}
        </>
    );
};

export default FormForm;
