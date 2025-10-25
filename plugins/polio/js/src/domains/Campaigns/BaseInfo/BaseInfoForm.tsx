import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import {
    BooleanInput,
    DateInput,
    Select,
    TextInput,
} from '../../../components/Inputs';
import { MultiSelect } from '../../../components/Inputs/MultiSelect';
import { OrgUnitsLevels } from '../../../components/Inputs/OrgUnitsSelect';
import MESSAGES from '../../../constants/messages';
import { CampaignFormValues } from '../../../constants/types';
import { polioViruses } from '../../../constants/virus';
import { useStyles } from '../../../styles/theme';
import { useGetGroupedCampaigns } from '../../GroupedCampaigns/hooks/useGetGroupedCampaigns';
import { useGetCampaignTypes } from '../hooks/api/useGetCampaignTypes';
import { useIsPolioCampaign } from '../hooks/useIsPolioCampaignCheck';
import { EmailListForCountry } from './EmailListForCountry/EmailListForCountry';

export const baseInfoFormFields: string[] = [
    'epid',
    'obr_name',
    'grouped_campaigns',
    'virus',
    'vaccines',
    'description',
    'gpei_coordinator',
    'initial_org_unit',
    'is_preventive',
    'is_test',
    'enable_send_weekly_email',
    'onset_at',
    'cvdpv2_notified_at',
    'outbreak_declaration_date',
];

export const BaseInfoForm: FunctionComponent = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const isUserAdmin = userHasPermission('iaso_polio_config', currentUser);
    const { data: groupedCampaigns } = useGetGroupedCampaigns();
    const groupedCampaignsOptions = useMemo(
        () =>
            groupedCampaigns?.results.map(result => ({
                label: result.name,
                value: result.id,
            })) ?? [],

        [groupedCampaigns],
    );
    const controlRef = useRef(false);

    const { values, touched, setFieldValue, setTouched } =
        useFormikContext<CampaignFormValues>();
    const { data: types, isFetching: isFetchingTypes } =
        useGetCampaignTypes(true);
    const isPolio = useIsPolioCampaign(values);
    const { top_level_org_unit_id } = values;
    const getLabelByKey = useCallback(
        key => {
            if (isPolio === undefined) return '';
            const labels = {
                obr_name: isPolio
                    ? MESSAGES.obrName
                    : MESSAGES.campaignIdentifier,
                gpei_coordinator: isPolio
                    ? MESSAGES.gpeiCoordinator
                    : MESSAGES.responsibleOfficer,
            };
            return formatMessage(labels[key]);
        },
        [formatMessage, isPolio],
    );

    const handleChangeCampaignTypes = useCallback(
        (key, newTypes?: string): void => {
            setFieldValue(
                key,
                newTypes ? newTypes.split(',').map(id => parseInt(id, 10)) : [],
            );
        },
        [setFieldValue],
    );

    // Using useEffect because changing `touched` in the update callback will result in desynchronized state
    // and wrong validation status for rounds
    useEffect(() => {
        if (values.is_planned && !controlRef.current) {
            controlRef.current = true;
            const touchedRounds = touched.rounds ?? [];
            values.rounds.forEach((_rnd, index) => {
                touchedRounds[index] = {
                    ...(touchedRounds[index] ?? []),
                    target_population: true,
                    percentage_covered_target_population: true,
                };
            });
            setTouched({ ...touched, rounds: touchedRounds });
        }
    }, [touched, values.rounds, setTouched, values.is_planned]);

    return (
        <Box maxWidth={isPolio ? '100%' : '400px'}>
            <Grid container spacing={2}>
                <Grid container item spacing={2}>
                    <Grid xs={12} md={isPolio ? 6 : 12} item>
                        <Field
                            label={formatMessage(MESSAGES.campaignType)}
                            name="campaign_types"
                            className={classes.input}
                            options={types}
                            required
                            component={MultiSelect}
                            isDisabled={isFetchingTypes}
                            onChange={handleChangeCampaignTypes}
                        />
                        <Field
                            name="initial_org_unit"
                            label={formatMessage(MESSAGES.selectOrgUnit)}
                            component={OrgUnitsLevels}
                            clearable={false}
                            required
                            disabled={!isUserAdmin}
                        />

                        <Field
                            label={getLabelByKey('obr_name')}
                            name="obr_name"
                            component={TextInput}
                            shrinkLabel={false}
                            className={classes.input}
                            required
                            disabled={!isUserAdmin}
                        />
                        <Field
                            className={classes.input}
                            label={formatMessage(MESSAGES.description)}
                            name="description"
                            component={TextInput}
                            shrinkLabel={false}
                        />
                        <Field
                            label={getLabelByKey('gpei_coordinator')}
                            name="gpei_coordinator"
                            component={TextInput}
                            shrinkLabel={false}
                        />
                        {isUserAdmin && (
                            <Field
                                className={classes.input}
                                label={formatMessage(MESSAGES.preventive)}
                                name="is_preventive"
                                component={BooleanInput}
                            />
                        )}
                        {isUserAdmin && (
                            <Field
                                className={classes.input}
                                label={formatMessage(MESSAGES.testCampaign)}
                                name="is_test"
                                component={BooleanInput}
                                disabled={values.on_hold || values.is_planned}
                            />
                        )}
                        {isUserAdmin && (
                            <Field
                                className={classes.input}
                                label={formatMessage(MESSAGES.campaignOnHold)}
                                name="on_hold"
                                component={BooleanInput}
                                disabled={values.is_test || values.is_planned}
                            />
                        )}
                        {isUserAdmin && (
                            <Field
                                className={classes.input}
                                label={formatMessage(MESSAGES.plannedCampaign)}
                                name="is_planned"
                                component={BooleanInput}
                                disabled={values.is_test || values.on_hold}
                                // onChange={handleChangePlannedStatus}
                            />
                        )}
                        {isUserAdmin && (
                            <>
                                <Field
                                    className={classes.input}
                                    label={formatMessage(
                                        MESSAGES.enable_send_weekly_email,
                                    )}
                                    name="enable_send_weekly_email"
                                    component={BooleanInput}
                                />
                                <EmailListForCountry
                                    countryId={top_level_org_unit_id}
                                />
                            </>
                        )}
                    </Grid>
                    {/* POLIO FIELDS */}
                    {isPolio && (
                        <Grid item xs={12} md={6}>
                            <Field
                                label={formatMessage(MESSAGES.virus)}
                                name="virus"
                                className={classes.input}
                                options={polioViruses}
                                required
                                clearable={false}
                                component={Select}
                            />
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(MESSAGES.vaccines)}
                                    name="vaccines"
                                    disabled
                                    component={TextInput}
                                    shrinkLabel={false}
                                    title={formatMessage(
                                        MESSAGES.helpTextEditVaccineViaScope,
                                    )}
                                />
                            </Box>
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(MESSAGES.epid)}
                                    name="epid"
                                    component={TextInput}
                                    shrinkLabel={false}
                                    className={classes.input}
                                />
                            </Box>
                            <Field
                                label={formatMessage(MESSAGES.groupedCampaigns)}
                                name="grouped_campaigns"
                                options={groupedCampaignsOptions}
                                withMarginTop={false}
                                component={MultiSelect}
                            />
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(
                                        MESSAGES.virusNotificationDate,
                                    )}
                                    fullWidth
                                    name="cvdpv2_notified_at"
                                    component={DateInput}
                                />
                            </Box>
                            <Field
                                label={formatMessage(
                                    MESSAGES.outbreakdeclarationdate,
                                )}
                                fullWidth
                                name="outbreak_declaration_date"
                                component={DateInput}
                            />
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(MESSAGES.dateOfOnset)}
                                    fullWidth
                                    name="onset_at"
                                    component={DateInput}
                                />
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};
