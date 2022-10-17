/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
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
import { Box, Divider, makeStyles, Typography } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import MESSAGES from '../../../constants/messages';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
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
import { redirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { BUDGET_DETAILS } from '../../../constants/routes';

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
    params: Record<string, any>;
};

const useStyles = makeStyles({ alignRight: { textAlign: 'right' } });

const CreateBudgetStep: FunctionComponent<Props> = ({
    campaignId,
    previousStep,
    closeDialog,
    isOpen,
    transitionKey,
    transitionLabel,
    id,
    requiredFields = [],
    params,
}) => {
    const currentUser = useCurrentUser();
    const { data: userHasTeam } = useUserHasTeam(currentUser?.user_id);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetStep } = useSaveBudgetStep();
    const classes = useStyles();
    const dispatch = useDispatch();
    const quickTransition = { params };
    const onSuccess = useCallback(() => {
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
            quickTransition: { _quickTransition },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
            previousStep: { stepFromParams },
            ...trimmedParams
        } = params;
        dispatch(redirectToReplace(BUDGET_DETAILS, trimmedParams));
    }, [dispatch, params]);

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
            url: fileLink.file,
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

    const formik = useFormik({
        initialValues: {
            transition_key: transitionKey,
            campaign: campaignId,
            comment: undefined,
            files: undefined,
            links: intialLinks,
            amount: previousStep?.amount,
            // this value is for handling non-field arrors from api
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
            if ((links?.length ?? []) > 0) {
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
    const allowConfirm = !quickTransition
        ? isValid && !isEqual(values, initialValues)
        : isValid;
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
                        </>

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
                        {/* @ts-ignore */}
                        {attachmentErrors.length > 0 && (
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
                    </>
                )}
                {!userHasTeam && <UserHasTeamWarning />}
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(CreateBudgetStep, AddStepButton);

export { modalWithButton as CreateBudgetStep };
