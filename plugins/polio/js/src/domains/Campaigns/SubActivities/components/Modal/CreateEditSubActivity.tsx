import React, { FunctionComponent } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik, useFormikContext } from 'formik';
import { isEqual } from 'lodash';
import { Box, Divider, Grid } from '@mui/material';
import {
    DateInput,
    NumberInput,
    TextInput,
} from '../../../../../components/Inputs';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import MESSAGES from '../../messages';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { useSaveSubActivity } from '../../hooks/api/useSaveSubActivity';
import { useAgeRangeOptions } from '../../hooks/useAgeRangeOptions';
import { CampaignFormValues, Round } from '../../../../../constants/types';
import { SubActivityScopeField } from '../SubActivityScopeField';
import { useSubActivityValidation } from '../../hooks/useSubActivityValidation';
import { SubActivityFormValues } from '../../types';

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
    const { values: campaign } = useFormikContext<CampaignFormValues>();
    const { mutateAsync: saveSubActivity, isLoading: isSaving } =
        useSaveSubActivity();
    const ageRangeOptions = useAgeRangeOptions();

    const validationSchema = useSubActivityValidation(round);

    const formik = useFormik<SubActivityFormValues>({
        initialValues: {
            round_number: round?.number,
            campaign: campaign.obr_name,
            id: subActivity?.id,
            name: subActivity?.name,
            start_date: subActivity?.start_date,
            end_date: subActivity?.end_date,
            age_unit: subActivity?.age_unit,
            age_min: subActivity?.age_min,
            age_max: subActivity?.age_max,
            scopes: subActivity?.scopes ?? [],
        },
        validationSchema,
        onSubmit: values => saveSubActivity(values),
    });
    const titleMessage = subActivity?.id
        ? MESSAGES.editSubActivity
        : MESSAGES.createSubActivity;

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
        isValuesChanged &&
        !isSaving;
    isScopeChanged;

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                id="create-edit-subActivity"
                dataTestId="create-edit-subActivity"
                onClose={() => null}
                closeDialog={closeDialog}
                open={isOpen}
                titleMessage={titleMessage}
                onConfirm={formik.handleSubmit}
                onCancel={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.confirm}
                cancelMessage={MESSAGES.cancel}
                allowConfirm={allowConfirm}
                maxWidth="xl"
                closeOnConfirm={false}
            >
                <Box minWidth="70vw">
                    <Box mb={4}>
                        <Divider />
                    </Box>
                    <Grid container spacing={2}>
                        {/* {isSaving || (formik.isSubmitting && <LoadingSpinner />)} */}
                        <Grid item xs={6}>
                            <Field
                                component={TextInput}
                                name="name"
                                label={formatMessage(MESSAGES.name)}
                                shrinkLabel={false}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Field
                                component={DateInput}
                                name="start_date"
                                label={formatMessage(MESSAGES.startDate)}
                                required
                            />
                        </Grid>
                        <Grid container item xs={6} spacing={2}>
                            <Grid item xs={6}>
                                <Field
                                    component={SingleSelect}
                                    name="age_unit"
                                    options={ageRangeOptions}
                                    label={formatMessage(MESSAGES.ageUnit)}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <Field
                                    component={NumberInput}
                                    name="age_min"
                                    label={formatMessage(MESSAGES.ageMin)}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <Field
                                    component={NumberInput}
                                    name="age_max"
                                    label={formatMessage(MESSAGES.ageMax)}
                                />
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
                        <Grid item xs={12}>
                            <SubActivityScopeField
                                campaign={campaign}
                                round={round}
                            />
                        </Grid>
                    </Grid>
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
