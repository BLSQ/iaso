import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { useFormik, FormikProvider } from 'formik';
import {
    useSafeIntl,
    ConfirmCancelModal,
    FilesUpload,
    makeFullModal,
    useRedirectToReplace,
} from 'bluesquare-components';
import { Box, Chip, Divider, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import MESSAGES from '../../../constants/messages';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { useUserHasTeam } from '../../../hooks/useGetTeams';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { OverrideStepForm } from '../types';
import { UserHasTeamWarning } from './UserHasTeamWarning';
import { AddMultipleLinks } from '../MultipleLinks/AddMultipleLinks';
import { useOverrideStepValidation } from '../hooks/validation';
import { useGetRecipientTeams } from '../hooks/api/useGetEmailRecipients';
import { OverrideStepButton } from './OverrideStepButton';
import { useSaveOverrideStep } from '../hooks/api/useSaveOverrideStep';
import { useGetWorkflowStatesForDropdown } from '../hooks/api/useGetBudget';
import { baseUrls } from '../../../constants/urls';

type Props = {
    budgetProcessId?: string;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
    requiredFields?: string[];
    params: Record<string, any>;
    recipients?: number[]; // team ids
};

const useStyles = makeStyles({
    alignRight: { textAlign: 'right' },
});

const CreateOverrideStep: FunctionComponent<Props> = ({
    budgetProcessId,
    closeDialog,
    isOpen,
    id,
    requiredFields = [],
    params,
    recipients = [],
}) => {
    const currentUser = useCurrentUser();
    const redirectToReplace = useRedirectToReplace();
    const { data: userHasTeam } = useUserHasTeam(currentUser?.user_id);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveOverrideStep } = useSaveOverrideStep();
    const classes = useStyles();
    const onSuccess = useCallback(() => {
        const trimmedParams = { ...params };
        if (params.quickTransition) {
            delete trimmedParams.quickTransition;
        }
        if (params.previousStep) {
            delete trimmedParams.previousStep;
        }
        redirectToReplace(baseUrls.budgetDetails, trimmedParams);
    }, [params, redirectToReplace]);

    const { data: recipientTeams } = useGetRecipientTeams(recipients);
    const { data: possibleStates, isLoading: possibleStatesIsLoading } =
        useGetWorkflowStatesForDropdown();

    const {
        apiErrors,
        payload,

        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: saveOverrideStep,
        onSuccess,
    });
    const validationSchema = useOverrideStepValidation(
        apiErrors,
        payload,
        requiredFields,
    );

    const formik = useFormik<OverrideStepForm>({
        initialValues: {
            new_state_key: undefined,
            budget_process: budgetProcessId,
            comment: undefined,
            files: undefined,
            links: undefined,
            amount: undefined,
            // this value is for handling non-field errors from api
            general: null,
            // This value is to handle error state when either files or links are required
            attachments: null,
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
        handleSubmit,
        resetForm,
    } = formik;
    const onChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldTouched, setFieldValue],
    );

    const getErrors = useTranslatedErrors({
        touched,
        errors,
        messages: MESSAGES,
        formatMessage,
    });
    const attachmentErrors = useMemo(() => {
        const anyFieldTouched = Object.values(touched).find(value => value);
        const attachmentsErrors = [errors.attachments] ?? [];
        if (anyFieldTouched) return attachmentsErrors;
        return [];
    }, [errors.attachments, touched]);

    useEffect(() => {
        const formHasBeenTouched = touched.links || touched.amount;
        if (!formHasBeenTouched) {
            const { links, amount } = values;
            if ((links ?? []).length > 0) {
                setFieldTouched('links', true);
            }
            if (amount) {
                setFieldTouched('amount', true);
            }
        }
    }, [setFieldTouched, touched.amount, touched.links, values]);

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                allowConfirm={isValid && userHasTeam}
                titleMessage="Override"
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
                <>
                    <Box mb={2}>
                        <InputComponent
                            type="select"
                            multi={false}
                            keyValue="new_state_key"
                            onChange={onChange}
                            value={values.new_state_key}
                            options={possibleStates}
                            errors={getErrors('new_state_key')}
                            label={MESSAGES.newBudgetState}
                            loading={possibleStatesIsLoading}
                            required
                        />
                    </Box>
                    <InputComponent
                        type="textarea"
                        keyValue="comment"
                        value={values.comment}
                        errors={getErrors('comment')}
                        label={MESSAGES.notes}
                        onChange={onChange}
                        withMarginTop={false}
                        required={requiredFields.includes('comment')}
                    />
                    <InputComponent
                        type="number"
                        keyValue="amount"
                        onChange={onChange}
                        value={values.amount}
                        errors={getErrors('amount')}
                        label={MESSAGES.amount}
                        required={requiredFields.includes('amount')}
                    />

                    <Box mt={2}>
                        <FilesUpload
                            files={values.files ?? []}
                            onFilesSelect={files => {
                                setFieldTouched('files', true);
                                setFieldValue('files', files);
                            }}
                            required={requiredFields.includes('files')}
                            errors={getErrors('files')}
                        />
                    </Box>
                    <Box mt={2}>
                        <Divider />
                    </Box>
                    <Box mt={2}>
                        <AddMultipleLinks
                            required={requiredFields.includes('links')}
                        />
                    </Box>
                    <Box mt={2} mb={2}>
                        <Divider />
                    </Box>
                    {(recipientTeams ?? []).length > 0 && (
                        <>
                            <Box mt={1} mb={1}>
                                <Typography>
                                    {formatMessage(MESSAGES.emailWillBeSentTo)}
                                </Typography>
                                {recipientTeams?.map(team => {
                                    return (
                                        <Box
                                            mt={1}
                                            mr={1}
                                            mb={1}
                                            display="inline-block"
                                            key={team}
                                        >
                                            <Chip
                                                label={team}
                                                variant="outlined"
                                                color="secondary"
                                            />
                                        </Box>
                                    );
                                })}
                            </Box>
                            <Box mt={2} mb={2}>
                                <Divider />
                            </Box>
                        </>
                    )}

                    {/* @ts-ignore */}
                    {(errors?.general ?? []).length > 0 && (
                        <>
                            {getErrors('general').map(e => (
                                <Typography
                                    key={`${e}-error`}
                                    color="error"
                                    className={classes.alignRight}
                                >
                                    {e}
                                </Typography>
                            ))}
                        </>
                    )}
                    {attachmentErrors.length > 0 &&
                        (touched.links || touched.files) && (
                            <>
                                {attachmentErrors.map(e => (
                                    <Typography
                                        key={`${e}-error`}
                                        color="error"
                                        className={classes.alignRight}
                                    >
                                        {e}
                                    </Typography>
                                ))}
                            </>
                        )}
                    {!touched.links &&
                        !touched.files &&
                        requiredFields.includes('attachments') && (
                            <Typography
                                color="textSecondary"
                                className={classes.alignRight}
                            >
                                {formatMessage(MESSAGES.linksOrFilesRequired)}
                            </Typography>
                        )}
                </>
                {!userHasTeam && <UserHasTeamWarning />}
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(CreateOverrideStep, OverrideStepButton);

export { modalWithButton as CreateOverrideStep };
