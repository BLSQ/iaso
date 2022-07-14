import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
// @ts-ignore
import { AddButton, useSafeIntl, IconButton } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import ConfirmCancelDialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
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
import {
    useGetTeamsDropDown,
    useGetApprovalTeams,
} from '../../hooks/useGetTeams';

type Props = {
    campaignId: string;
    // eslint-disable-next-line react/require-default-props
    type?: 'create' | 'edit' | 'retry';
    // eslint-disable-next-line react/require-default-props
    budgetEvent?: any;
    // eslint-disable-next-line react/require-default-props
    iconColor?: string;
};

const renderTrigger =
    (type: 'create' | 'edit' | 'retry' = 'create', color = 'action') =>
    ({ openDialog }) => {
        if (type === 'edit') {
            return (
                <IconButton
                    color={color}
                    onClick={openDialog}
                    icon="edit"
                    tooltipMessage={MESSAGES.resendFiles}
                />
            );
        }
        return (
            // The div prevents the Button from being too big on small screens
            <div>
                <AddButton
                    onClick={openDialog}
                    dataTestId="create-budgetStep-button"
                    message={MESSAGES.addStep}
                />
            </div>
        );
    };

const getTitleMessage = (type: 'create' | 'edit' | 'retry') => {
    if (type === 'create') return MESSAGES.newBudgetStep;
    if (type === 'edit') return MESSAGES.resendFiles;
    if (type === 'retry') return MESSAGES.tryUpdateStep;
    throw new Error(
        `expected type to be one of: create, edit,retry, got ${type}`,
    );
};

const makeEventsDropdown = (user, approvalTeams, formatMessage) => {
    const isUserApprover = Boolean(
        approvalTeams
            ?.map(validationTeam => validationTeam.users)
            .flat()
            .find(userId => userId === user.user_id),
    );
    const baseOptions = [
        {
            value: 'submission',
            label: formatMessage(MESSAGES.submission),
        },
        {
            value: 'comments',
            label: formatMessage(MESSAGES.comments),
        },
    ];
    if (isUserApprover) {
        return [
            ...baseOptions,
            {
                value: 'validation',
                label: formatMessage(MESSAGES.validation),
            },
        ];
    }
    return baseOptions;
};

export const CreateEditBudgetEvent: FunctionComponent<Props> = ({
    campaignId,
    budgetEvent,
    type = 'create',
    iconColor = 'action',
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
            // status: budgetEvent?.status ?? 'validation_ongoing',
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
                renderTrigger={renderTrigger(type, iconColor)}
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
                {values.type !== 'validation' && (
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
