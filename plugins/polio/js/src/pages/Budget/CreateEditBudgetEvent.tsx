import React, { FunctionComponent, useCallback, useState } from 'react';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
// @ts-ignore
import { AddButton, useSafeIntl, IconButton } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import ConfirmCancelDialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
import { useGetTeams as useGetTeamsOptions } from '../../../../../../hat/assets/js/apps/Iaso/domains/plannings/hooks/requests/useGetTeams';
import MESSAGES from '../../constants/messages';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { commaSeparatedIdsToArray } from '../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import {
    useFinalizeBudgetEvent,
    useSaveBudgetEvent,
    useUploadBudgetFiles,
} from '../../hooks/useSaveBudgetEvent';
import FileInputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/FileInputComponent';
import { useBudgetEvenValidation } from './hooks/validation';

type Props = {
    campaignId: string;
    // eslint-disable-next-line react/require-default-props
    type?: 'create' | 'edit' | 'retry';
    // eslint-disable-next-line react/require-default-props
    budgetEvent?: any;
};

const renderTrigger =
    (type: 'create' | 'edit' | 'retry' = 'create') =>
    ({ openDialog }) => {
        if (type === 'edit') {
            return (
                <IconButton
                    onClick={openDialog}
                    icon="edit"
                    tooltipMessage={MESSAGES.resendFiles}
                />
            );
        }
        return (
            <AddButton
                onClick={openDialog}
                dataTestId="create-budgetStep-button"
                message={MESSAGES.addStep}
            />
        );
    };

export const CreateEditBudgetEvent: FunctionComponent<Props> = ({
    campaignId,
    budgetEvent,
    type = 'create',
}) => {
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsOptions();
    const [currentType, setCurrentType] = useState<'create' | 'edit' | 'retry'>(
        type,
    );
    console.log('currentType', currentType);
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetEvent } = useSaveBudgetEvent(type);
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
            status: budgetEvent?.status ?? 'validation_ongoing',
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
                        uploadFiles(
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
                            },
                        );
                    }
                    // closeModal.closeDialog();
                    // resetForm();
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
    const titleMessage =
        currentType === 'create'
            ? MESSAGES.newBudgetStep
            : MESSAGES.resendFiles;
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
                    resetForm();
                }}
                maxWidth="sm"
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.send}
                renderTrigger={renderTrigger(type)}
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
                                if (value === 'validation') {
                                    setFieldValue('status', 'validated');
                                }
                                onChange(keyValue, value);
                            }}
                            value={values.type}
                            errors={getErrors('type')}
                            label={MESSAGES.eventType}
                            options={[
                                {
                                    value: 'submission',
                                    label: formatMessage(MESSAGES.submission),
                                },
                                {
                                    value: 'comments',
                                    label: formatMessage(MESSAGES.comments),
                                },
                                {
                                    value: 'validation',
                                    label: formatMessage(MESSAGES.validation),
                                },
                            ]}
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
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
