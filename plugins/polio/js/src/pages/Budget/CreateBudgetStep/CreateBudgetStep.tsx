/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import React, { FunctionComponent } from 'react';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    FilesUpload,
    // @ts-ignore
    makeFullModal,
} from 'bluesquare-components';
import { Box, Divider, Typography } from '@material-ui/core';
import MESSAGES from '../../../constants/messages';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

import { useBudgetEventValidation } from '../hooks/validation';
import { useUserHasTeam } from '../../../hooks/useGetTeams';

import {
    useTranslatedErrors,
    useApiErrorValidation,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { useSaveBudgetStep } from '../mockAPI/useSaveBudgetStep';
import { AddStepButton } from './AddStepButton';

type Props = {
    campaignId: string;
    budgetEvent?: any;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
    isMobileLayout?: boolean;
};

const CreateBudgetStep: FunctionComponent<Props> = ({
    campaignId,
    budgetEvent,
    closeDialog,
    isOpen,
    id,
}) => {
    const currentUser = useCurrentUser();
    const { data: userHasTeam } = useUserHasTeam(currentUser?.user_id);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetStep } = useSaveBudgetStep();

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: saveBudgetStep,
    });
    const validationSchema = useBudgetEventValidation(apiErrors, payload);
    const formik = useFormik({
        initialValues: {
            campaign: campaignId,
            comment: budgetEvent?.comment ?? null,
            files: budgetEvent?.files ?? null,
            links: budgetEvent?.links ?? null,
            // internal: budgetEvent?.internal ?? false,
            amount: budgetEvent?.amount ?? null,
            general: null,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: save,
    });
    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        errors,
        isValid,
        initialValues,
        handleSubmit,
        resetForm,
    } = formik;

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };
    const getErrors = useTranslatedErrors({
        touched,
        errors,
        messages: MESSAGES,
        formatMessage,
    });

    const titleMessage = MESSAGES.newBudgetStep;

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={() => {
                    if (userHasTeam) {
                        handleSubmit();
                    }
                }}
                onCancel={() => {
                    if (userHasTeam) {
                        resetForm();
                    }
                }}
                maxWidth="sm"
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.send}
                open={isOpen}
                closeDialog={closeDialog}
                id={id ?? ''}
                dataTestId="Test-modal"
                onClose={() => null}
            >
                {userHasTeam && (
                    <>
                        <>
                            <InputComponent
                                type="text"
                                keyValue="comment"
                                multiline
                                onChange={onChange}
                                value={values.comment}
                                errors={getErrors('comment')}
                                label={MESSAGES.notes}
                            />
                            <InputComponent
                                type="number"
                                keyValue="amount"
                                onChange={onChange}
                                value={values.amount}
                                errors={getErrors('amount')}
                                label={MESSAGES.amount}
                            />
                        </>

                        <Box mt={2}>
                            <FilesUpload
                                files={values.files ?? []}
                                onFilesSelect={files => {
                                    setFieldTouched('files', true);
                                    setFieldValue('files', files);
                                }}
                            />
                        </Box>

                        <InputComponent
                            type="text"
                            keyValue="links"
                            multiline
                            onChange={onChange}
                            value={values.links}
                            errors={getErrors('links')}
                            label={MESSAGES.links}
                        />

                        {/* {values.type !== 'validation' &&
                             (
                                <InputComponent
                                    type="checkbox"
                                    keyValue="internal"
                                    label={MESSAGES.internal}
                                    onChange={onChange}
                                    value={values.internal}
                                />
                            )} */}
                        {/* @ts-ignore */}
                        {(errors?.general ?? []).length > 0 && (
                            <>
                                {getErrors('general').map(e => (
                                    <Typography
                                        key={`${e}-error`}
                                        color="error"
                                    >
                                        {e}
                                    </Typography>
                                ))}
                            </>
                        )}
                    </>
                )}
                {!userHasTeam && (
                    <>
                        <Divider />
                        <Box mb={2} mt={2}>
                            <Typography style={{ fontWeight: 'bold' }}>
                                {formatMessage(MESSAGES.userNeedsTeam)}
                            </Typography>
                        </Box>
                    </>
                )}
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(CreateBudgetStep, AddStepButton);

export { modalWithButton as CreateBudgetStep };
