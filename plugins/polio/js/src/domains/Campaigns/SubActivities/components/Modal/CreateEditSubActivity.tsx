import { Box, Divider, Grid } from '@mui/material';
import {
    AddButton,
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik, useFormikContext } from 'formik';
import { isEqual } from 'lodash';
import React, { FunctionComponent, useCallback } from 'react';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import {
    DateInput,
    NumberInput,
    TextInput,
} from '../../../../../components/Inputs';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import { CampaignFormValues, Round } from '../../../../../constants/types';
import { useAgeRangeOptions } from '../../hooks/useAgeRangeOptions';
import { useSubActivityValidation } from '../../hooks/useSubActivityValidation';
import MESSAGES from '../../messages';
import { SubActivityFormValues } from '../../types';
import { SubActivityScopeField } from '../SubActivityScopeField';

type Props = {
    closeDialog: () => void;
    isOpen: boolean;
    subActivity?: any;
    round?: Round;
};

export const CreateEditSubActivity: FunctionComponent<Props> = ({
    subActivity,
    closeDialog,
    isOpen,
    round,
}) => {
    const { formatMessage } = useSafeIntl();
    const {
        values: campaign,
        setFieldValue: setCampaignFieldValue,
        handleSubmit: saveCampaign,
    } = useFormikContext<CampaignFormValues>();

    const ageRangeOptions = useAgeRangeOptions();
    const validationSchema = useSubActivityValidation();

    // TODO Add parent round dates to formik to enable validation
    // Then remove them before sending to API

    const formik = useFormik<SubActivityFormValues>({
        initialValues: {
            id: subActivity?.id,
            round_number: round?.number,
            round_start_date: round?.started_at,
            round_end_date: round?.ended_at,
            campaign: campaign.obr_name,
            name: subActivity?.name,
            start_date: subActivity?.start_date,
            end_date: subActivity?.end_date,
            lqas_started_at: subActivity?.lqas_started_at,
            lqas_ended_at: subActivity?.lqas_ended_at,
            im_started_at: subActivity?.im_started_at,
            im_ended_at: subActivity?.im_ended_at,
            age_unit: subActivity?.age_unit,
            age_min: subActivity?.age_min,
            age_max: subActivity?.age_max,
            scopes: subActivity?.scopes ?? [],
        },
        validationSchema,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onSubmit: () => {},
    });
    const { values } = formik;
    const titleMessage = subActivity?.id
        ? `${formatMessage(MESSAGES.editSubActivity)} - ${
              campaign.obr_name
          } - Round ${round?.number}`
        : `${formatMessage(MESSAGES.createSubActivity)} - ${
              campaign.obr_name
          } - Round ${round?.number}`;

    const onConfirm = useCallback(() => {
        setCampaignFieldValue('subactivity', values);
        saveCampaign();
        closeDialog();
    }, [closeDialog, saveCampaign, setCampaignFieldValue, values]);

    const isScopeChanged = !isEqual(
        formik.initialValues.scopes.map(scope => scope.group.org_units).flat(),
        formik.values.scopes.map(scope => scope.group.org_units).flat(),
    );

    // isEqual won't catch changes in scopes because of deep nesting, so we check it on its own
    const isValuesChanged =
        !isEqual(formik.initialValues, formik.values) || isScopeChanged;
    const allowConfirm =
        formik.isValid &&
        (!isEqual(formik.touched, {}) || isScopeChanged) &&
        !formik.isSubmitting &&
        isValuesChanged;

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                id="create-edit-subActivity"
                dataTestId="create-edit-subActivity"
                onClose={() => null}
                closeDialog={closeDialog}
                open={isOpen}
                titleMessage={titleMessage}
                onConfirm={onConfirm}
                onCancel={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.confirm}
                cancelMessage={MESSAGES.cancel}
                allowConfirm={allowConfirm}
                maxWidth="xl"
                closeOnConfirm={false}
            >
                <Box>
                    <Box mb={4} mt={2}>
                        <Divider />
                    </Box>
                    {formik.isSubmitting && <LoadingSpinner />}
                    <Box>
                        <Grid container>
                            <Grid item xs={6}>
                                <Box mr={2}>
                                    <Field
                                        component={TextInput}
                                        name="name"
                                        label={formatMessage(MESSAGES.name)}
                                        shrinkLabel={false}
                                        required
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Field
                                    component={DateInput}
                                    name="start_date"
                                    label={formatMessage(MESSAGES.startDate)}
                                    required
                                />
                            </Grid>
                            <Grid container item xs={6}>
                                <Grid item xs={6}>
                                    <Box mr={2}>
                                        <Field
                                            component={SingleSelect}
                                            name="age_unit"
                                            options={ageRangeOptions}
                                            label={formatMessage(
                                                MESSAGES.ageUnit,
                                            )}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box mr={2}>
                                        <Field
                                            component={NumberInput}
                                            name="age_min"
                                            label={formatMessage(
                                                MESSAGES.ageMin,
                                            )}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box mr={2}>
                                        <Field
                                            component={NumberInput}
                                            name="age_max"
                                            label={formatMessage(
                                                MESSAGES.ageMax,
                                            )}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                            <Grid item xs={6}>
                                <Field
                                    component={DateInput}
                                    name="end_date"
                                    label={formatMessage(MESSAGES.endDate)}
                                    required
                                />
                            </Grid>

                            <Grid item xs={3}>
                                <Box mr={2}>
                                    <Field
                                        component={DateInput}
                                        name="lqas_started_at"
                                        label={formatMessage(
                                            MESSAGES.lqas_started_at,
                                        )}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={3}>
                                <Box mr={2}>
                                    <Field
                                        component={DateInput}
                                        name="lqas_ended_at"
                                        label={formatMessage(
                                            MESSAGES.lqas_ended_at,
                                        )}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={3}>
                                <Box mr={2}>
                                    <Field
                                        component={DateInput}
                                        name="im_started_at"
                                        label={formatMessage(
                                            MESSAGES.im_started_at,
                                        )}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={3}>
                                <Field
                                    component={DateInput}
                                    name="im_ended_at"
                                    label={formatMessage(MESSAGES.im_ended_at)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <SubActivityScopeField
                                    campaign={campaign}
                                    round={round}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

export const CreateSubActivity = makeFullModal(
    CreateEditSubActivity,
    AddButton,
);
export const EditSubActivity = makeFullModal(
    CreateEditSubActivity,
    EditIconButton,
);
