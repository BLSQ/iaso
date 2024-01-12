/* eslint-disable camelcase */
/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { useFormik, FormikProvider } from 'formik';
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
import { Box, Chip, Divider, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';
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
import { redirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { BUDGET_DETAILS } from '../../../constants/routes';
import { TextArea } from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/TextArea';
import { useGetRecipientTeams } from '../hooks/api/useGetEmailRecipients';
import { OverrideStepButton } from './OverrideStepButton';
import { useSaveOverrideStep } from '../hooks/api/useSaveOverrideStep';
import { useGetWorkflowStatesForDropdown } from '../hooks/api/useGetBudget';

type Props = {
    campaignId: string;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
    isMobileLayout?: boolean;
    requiredFields?: string[];
    params: Record<string, any>;
    recipients?: number[]; // team ids
};

const useStyles = makeStyles({
    alignRight: { textAlign: 'right' },
});

const CreateOverrideStep: FunctionComponent<Props> = ({
    campaignId,
    closeDialog,
    isOpen,
    id,
    requiredFields = [],
    params,
    recipients = [],
}) => {
    const currentUser = useCurrentUser();
    const { data: userHasTeam } = useUserHasTeam(currentUser?.user_id);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveOverrideStep } = useSaveOverrideStep();
    const classes = useStyles();
    const dispatch = useDispatch();
    const onSuccess = useCallback(() => {
        const trimmedParams = { ...params };
        if (params.quickTransition) {
            delete trimmedParams.quickTransition;
        }
        if (params.previousStep) {
            delete trimmedParams.previousStep;
        }
        dispatch(redirectToReplace(BUDGET_DETAILS, trimmedParams));
    }, [dispatch, params]);

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
            campaign: campaignId,
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

    const onCommentChange = useCallback(
        newValue => onChange('comment', newValue),
        [onChange],
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
                            isLoading={possibleStatesIsLoading}
                            required
                        />
                    </Box>
                    <TextArea
                        value={values.comment}
                        errors={getErrors('comment')}
                        label={formatMessage(MESSAGES.notes)}
                        onChange={onCommentChange}
                        required={requiredFields.includes('comment')}
                        debounceTime={0}
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
