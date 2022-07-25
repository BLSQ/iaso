/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import ConfirmCancelDialogComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../../../constants/messages';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { commaSeparatedIdsToArray } from '../../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import {
    useFinalizeBudgetEvent,
    useSaveBudgetEvent,
    useUploadBudgetFiles,
} from '../../../hooks/useSaveBudgetEvent';
import FileInputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/FileInputComponent';
import { useBudgetEvenValidation } from '../hooks/validation';
import {
    useGetTeamsDropDown,
    useGetApprovalTeams,
} from '../../../hooks/useGetTeams';
import { getTitleMessage, useRenderTrigger, makeEventsDropdown } from './utils';

type Props = {
    campaignId: string;
    type?: 'create' | 'edit' | 'retry';
    budgetEvent?: any;
    iconColor?: string;
    isMobileLayout?: boolean;
};

export const CreateEditBudgetEvent: FunctionComponent<Props> = ({
    campaignId,
    budgetEvent,
    type = 'create',
    iconColor = 'action',
    isMobileLayout = false,
}) => {
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsDropDown();
    const { data: approvalTeams } = useGetApprovalTeams();

    const user = useCurrentUser();
    const [currentType, setCurrentType] = useState<'create' | 'edit' | 'retry'>(
        type,
    );
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetEvent } = useSaveBudgetEvent(currentType);
    const { mutateAsync: uploadFiles } = useUploadBudgetFiles();
    const { mutateAsync: finalize } = useFinalizeBudgetEvent();
    const [closeModal, setCloseModal] = useState<any>();
    const validationSchema = useBudgetEvenValidation();

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
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: values =>
            saveBudgetEvent(values, {
                onSuccess: (result: any) => {
                    if (type === 'create' || type === 'retry') {
                        if (values.files) {
                            uploadFiles(
                                // @ts-ignore
                                { ...values, id: result.id },
                                {
                                    onSuccess: () => {
                                        finalize(result.id, {
                                            onSuccess: () => {
                                                closeModal.closeDialog();
                                                resetForm();
                                            },
                                            onError: () =>
                                                setCurrentType(value => {
                                                    if (value === 'create')
                                                        return 'retry';
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
                                    closeModal.closeDialog();
                                    resetForm();
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
                        finalize(values.id, {
                            onSuccess: () => {
                                closeModal.closeDialog();
                                resetForm();
                            },
                            onError: () =>
                                setCurrentType(value => {
                                    if (value === 'create') return 'retry';
                                    return value;
                                }),
                        });
                    }
                },
                onError: () =>
                    setCurrentType(value => {
                        if (value === 'create') return 'retry';
                        return value;
                    }),
            }),
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
    const getErrors = useCallback(
        keyValue => {
            if (!touched[keyValue]) return [];
            return errors[keyValue] ? [errors[keyValue]] : [];
        },
        [errors, touched],
    );
    const titleMessage = useMemo(
        () => getTitleMessage(currentType),
        [currentType],
    );

    const eventOptions = useMemo(
        () => makeEventsDropdown(user, approvalTeams, formatMessage),
        [formatMessage, user, approvalTeams],
    );
    const renderTrigger = useRenderTrigger(type, isMobileLayout, iconColor);

    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={closeDialog => {
                    setCloseModal({ closeDialog });
                    handleSubmit();
                }}
                onCancel={closeDialog => {
                    closeDialog();
                    setCurrentType(type);
                    resetForm();
                }}
                maxWidth="sm"
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.send}
                renderTrigger={renderTrigger}
            >
                {(currentType === 'create' || currentType === 'retry') && (
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
                    <FileInputComponent
                        keyValue="files"
                        required={currentType === 'edit'}
                        multiple
                        onChange={onChange}
                        value={values.files}
                        errors={getErrors('files')}
                        label={MESSAGES.filesUpload}
                    />
                </Box>
                {(currentType === 'create' || currentType === 'retry') && (
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
                {values.type !== 'validation' && currentType !== 'edit' && (
                    <InputComponent
                        type="checkbox"
                        keyValue="internal"
                        label={MESSAGES.internal}
                        onChange={onChange}
                        value={values.internal}
                    />
                )}
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
