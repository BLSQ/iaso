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

// import { useBudgetStepValidation } from '../hooks/validation';
import { useUserHasTeam } from '../../../hooks/useGetTeams';

import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { useSaveBudgetStep } from '../hooks/api/useSaveBudgetStep';
import { AddStepButton } from './AddStepButton';
import { BudgetStep } from '../types';
import { UserHasTeamWarning } from './UserHasTeamWarning';
import { AddMultipleLinks } from '../MultipleLinks/AddMultipleLinks';
import { useBudgetStepValidation } from '../hooks/validation';

type Props = {
    campaignId: string;
    previousStep?: BudgetStep;
    transitionKey: string;
    transitionLabel: string;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
    isMobileLayout?: boolean;
    requiredFields?: string[];
};

const CreateBudgetStep: FunctionComponent<Props> = ({
    campaignId,
    previousStep,
    closeDialog,
    isOpen,
    transitionKey,
    transitionLabel,
    id,
    requiredFields = [],
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
    const validationSchema = useBudgetStepValidation(
        apiErrors,
        payload,
        requiredFields,
    );
    const formik = useFormik({
        initialValues: {
            transition_key: transitionKey,
            campaign: campaignId,
            comment: undefined,
            files: previousStep?.files,
            links: previousStep?.links,
            amount: previousStep?.amount,
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

    const titleMessage = transitionLabel;

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
                        <Box mt={2}>
                            <Divider />
                        </Box>
                        <Box mt={2}>
                            <Typography>
                                {formatMessage(MESSAGES.links)}
                            </Typography>
                        </Box>
                        <Box mt={2}>
                            <AddMultipleLinks />
                        </Box>
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
                {!userHasTeam && <UserHasTeamWarning />}
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(CreateBudgetStep, AddStepButton);

export { modalWithButton as CreateBudgetStep };
