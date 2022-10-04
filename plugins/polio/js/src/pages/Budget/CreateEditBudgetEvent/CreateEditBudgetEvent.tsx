/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import React, { FunctionComponent, useMemo, useState } from 'react';
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
import { commaSeparatedIdsToArray } from '../../../../../../../hat/assets/js/apps/Iaso/utils/forms';

import {
    useFinalizeBudgetEvent,
    useSaveBudgetEvent,
    useUploadBudgetFiles,
} from '../../../hooks/useSaveBudgetEvent';
import { useBudgetEventValidation } from '../hooks/validation';
import {
    useGetTeamsDropDown,
    useGetApprovalTeams,
    useUserHasTeam,
} from '../../../hooks/useGetTeams';
import { getTitleMessage, makeEventsDropdown } from './utils';
import {
    useTranslatedErrors,
    useApiErrorValidation,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { CreateEditButton } from './CreateEditButton';

type Props = {
    campaignId: string;
    type?: 'create' | 'edit' | 'retry';
    budgetEvent?: any;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
    isMobileLayout?: boolean;
};

const CreateEditBudgetEvent: FunctionComponent<Props> = ({
    campaignId,
    budgetEvent,
    type = 'create',
    closeDialog,
    isOpen,
    id,
}) => {
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsDropDown();
    const { data: approvalTeams } = useGetApprovalTeams();

    const user = useCurrentUser();
    const [currentType, setCurrentType] = useState<'create' | 'edit' | 'retry'>(
        type,
    );
    const currentUser = useCurrentUser();
    const { data: userHasTeam } = useUserHasTeam(currentUser?.user_id);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetEvent } = useSaveBudgetEvent(currentType);
    const { mutateAsync: uploadFiles } = useUploadBudgetFiles();
    const { mutateAsync: finalize } = useFinalizeBudgetEvent();

    const onSubmitSuccess = (result: any) => {
        if (type === 'create' || type === 'retry') {
            if (formik.values.files) {
                uploadFiles(
                    // @ts-ignore
                    { ...formik.values, id: result.id },
                    {
                        onSuccess: () => {
                            finalize(result.id, {
                                onSuccess: () => {
                                    closeDialog();
                                    formik.resetForm();
                                },
                                onError: () =>
                                    setCurrentType(value => {
                                        if (value === 'create') return 'retry';
                                        return value;
                                    }),
                            });
                        },
                        onError: () => setCurrentType('retry'),
                    },
                );
            } else {
                finalize(result.id, {
                    onSuccess: () => {
                        closeDialog();
                        formik.resetForm();
                    },
                    onError: () =>
                        setCurrentType(value => {
                            if (value === 'create') return 'retry';
                            return value;
                        }),
                });
            }
        }
        if (type === 'edit') {
            finalize(formik.values.id, {
                onSuccess: () => {
                    closeDialog();
                    formik.resetForm();
                },
                onError: () =>
                    setCurrentType(value => {
                        if (value === 'create') return 'retry';
                        return value;
                    }),
            });
        }
    };

    const onSubmitError = () => {
        setCurrentType(value => {
            if (value === 'create') return 'retry';
            return value;
        });
    };

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: saveBudgetEvent,
        onSuccess: onSubmitSuccess,
        onError: onSubmitError,

        // convertError: convertAPIErrorsToState,
    });
    const validationSchema = useBudgetEventValidation(apiErrors, payload);
    const formik = useFormik({
        initialValues: {
            id: budgetEvent?.id,
            campaign: campaignId,
            author: currentUser.id,
            target_teams: budgetEvent?.target_teams ?? [],
            type: budgetEvent?.type ?? null,
            comment: budgetEvent?.comment ?? null,
            files: budgetEvent?.files ?? null,
            links: budgetEvent?.links ?? null,
            internal: budgetEvent?.internal ?? false,
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

    const titleMessage = useMemo(
        () => getTitleMessage(currentType),
        [currentType],
    );

    const eventOptions = useMemo(
        () => makeEventsDropdown(user, approvalTeams, formatMessage),
        [formatMessage, user, approvalTeams],
    );

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
                        setCurrentType(type);
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
                        {(currentType === 'create' ||
                            currentType === 'retry') && (
                            <>
                                <InputComponent
                                    type="select"
                                    required
                                    keyValue="target_teams"
                                    multi
                                    disabled={currentType !== 'create'}
                                    onChange={(keyValue, value) => {
                                        onChange(
                                            keyValue,
                                            commaSeparatedIdsToArray(value),
                                        );
                                    }}
                                    value={values.target_teams}
                                    errors={getErrors('target_teams')}
                                    label={MESSAGES.destination}
                                    options={teamsDropdown}
                                    loading={isFetchingTeams}
                                />

                                <InputComponent
                                    type="select"
                                    required
                                    disabled={currentType !== 'create'}
                                    keyValue="type"
                                    onChange={(keyValue, value) => {
                                        onChange(keyValue, value);
                                    }}
                                    value={values.type}
                                    errors={getErrors('type')}
                                    label={MESSAGES.eventType}
                                    options={eventOptions}
                                />

                                <InputComponent
                                    type="text"
                                    keyValue="comment"
                                    multiline
                                    disabled={currentType !== 'create'}
                                    onChange={onChange}
                                    value={values.comment}
                                    errors={getErrors('comment')}
                                    label={MESSAGES.notes}
                                />
                                <InputComponent
                                    type="number"
                                    keyValue="amount"
                                    disabled={currentType !== 'create'}
                                    onChange={onChange}
                                    value={values.amount}
                                    errors={getErrors('amount')}
                                    label={MESSAGES.amount}
                                />
                            </>
                        )}
                        <Box mt={2}>
                            <FilesUpload
                                files={values.files ?? []}
                                onFilesSelect={files => {
                                    setFieldTouched('files', true);
                                    setFieldValue('files', files);
                                }}
                            />
                        </Box>
                        {(currentType === 'create' ||
                            currentType === 'retry') && (
                            <InputComponent
                                type="text"
                                keyValue="links"
                                multiline
                                disabled={currentType !== 'create'}
                                onChange={onChange}
                                value={values.links}
                                errors={getErrors('links')}
                                label={MESSAGES.links}
                            />
                        )}
                        {values.type !== 'validation' &&
                            currentType !== 'edit' && (
                                <InputComponent
                                    type="checkbox"
                                    keyValue="internal"
                                    label={MESSAGES.internal}
                                    onChange={onChange}
                                    value={values.internal}
                                />
                            )}
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

const modalWithButton = makeFullModal(CreateEditBudgetEvent, CreateEditButton);

export { modalWithButton as CreateEditBudgetEvent };
