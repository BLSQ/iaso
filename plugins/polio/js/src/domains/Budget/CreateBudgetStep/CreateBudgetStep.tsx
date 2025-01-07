import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
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
import { useSaveBudgetStep } from '../hooks/api/useSaveBudgetStep';
import { AddStepButton, RepeatStepIcon } from './AddStepButton';
import { BudgetStep, StepForm } from '../types';
import { UserHasTeamWarning } from './UserHasTeamWarning';
import { AddMultipleLinks } from '../MultipleLinks/AddMultipleLinks';
import { useBudgetStepValidation } from '../hooks/validation';
import { useGetRecipientTeams } from '../hooks/api/useGetEmailRecipients';
import { baseUrls } from '../../../constants/urls';

type Props = {
    budgetProcessId?: string;
    previousStep?: BudgetStep;
    transitionKey: string;
    transitionLabel: string;
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

const CreateBudgetStep: FunctionComponent<Props> = ({
    budgetProcessId,
    previousStep,
    closeDialog,
    isOpen,
    transitionKey,
    transitionLabel,
    id,
    requiredFields = [],
    params,
    recipients = [],
}) => {
    const currentUser = useCurrentUser();
    const redirectToReplace = useRedirectToReplace();
    const { data: userHasTeam } = useUserHasTeam(currentUser?.user_id);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetStep } = useSaveBudgetStep();
    const classes = useStyles();
    const quickTransition = params?.quickTransition;
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

    const {
        apiErrors,
        payload,

        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: saveBudgetStep,
        onSuccess,
    });
    const validationSchema = useBudgetStepValidation(
        apiErrors,
        payload,
        requiredFields,
    );
    const intialLinks = useMemo(() => {
        const fileLinks = previousStep?.files;
        const filesAsLinks = (fileLinks ?? []).map(fileLink => ({
            alias: fileLink.filename,
            url: fileLink.permanent_url,
        }));
        const previousStepLinks = previousStep?.links;
        if (!quickTransition) {
            return previousStepLinks;
        }
        if (previousStepLinks && fileLinks) {
            return [...filesAsLinks, ...previousStepLinks];
        }
        if (!previousStepLinks && fileLinks) {
            return filesAsLinks;
        }
        if (previousStepLinks && !fileLinks) {
            return previousStepLinks;
        }
        return undefined;
    }, [quickTransition, previousStep]);

    const formik = useFormik<StepForm>({
        initialValues: {
            transition_key: transitionKey,
            budget_process: budgetProcessId,
            comment: undefined,
            files: undefined,
            links: intialLinks,
            amount: previousStep?.amount,
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
        initialValues,
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

    const titleMessage = transitionLabel;

    useEffect(() => {
        const formHasBeenTouched = touched.links || touched.amount;
        if (quickTransition && !formHasBeenTouched) {
            const { links, amount } = values;
            if ((links ?? []).length > 0) {
                setFieldTouched('links', true);
            }
            if (amount) {
                setFieldTouched('amount', true);
            }
        }
    }, [
        previousStep,
        quickTransition,
        setFieldTouched,
        touched.amount,
        touched.links,
        values,
    ]);

    const allowConfirm =
        quickTransition || requiredFields.length === 0
            ? isValid
            : isValid && !isEqual(values, initialValues);

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                allowConfirm={allowConfirm}
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
                <>
                    <Box mt={1}>
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
                    </Box>
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

const modalWithButton = makeFullModal(CreateBudgetStep, AddStepButton);
const modalWithIcon = makeFullModal(CreateBudgetStep, RepeatStepIcon);

export {
    modalWithButton as CreateBudgetStep,
    modalWithIcon as CreateBudgetStepIcon,
};
