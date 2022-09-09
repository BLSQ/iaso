/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import React, { FunctionComponent, useMemo, useState } from 'react';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Box, Divider, Grid, Paper, Typography } from '@material-ui/core';
import { useDropzone } from 'react-dropzone';
import { makeStyles } from '@material-ui/styles';
import { ConfirmCancelModal } from '../../../../../../../hat/assets/js/apps/Iaso/components/DragAndDrop/ConfirmCancelModal';
// import ConfirmCancelDialogComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
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
// import { FilesUpload } from '../../../../../../../hat/assets/js/apps/Iaso/components/DragAndDrop/FilesUpload';

import { FilesUploadnoState } from '../../../../../../../hat/assets/js/apps/Iaso/components/DragAndDrop/FilesUploadNoState';
import { makeFullModal } from '../../../../../../../hat/assets/js/apps/Iaso/components/DragAndDrop/ModalWithButton';
import DNDMESSAGES from '../../../../../../../hat/assets/js/apps/Iaso/components/DragAndDrop/messages';

type Props = {
    campaignId: string;
    type?: 'create' | 'edit' | 'retry';
    budgetEvent?: any;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
    isMobileLayout?: boolean;
    // TODO use exporetd type when available
    selectedFiles: File[];
};

const styles = theme => ({
    cssGridContainer: {
        display: 'grid',
    },

    layer: {
        gridColumn: 1,
        gridRow: 1,
    },
    visible: { visibility: 'visible' },
    hidden: { visibility: 'hidden' },
    outlined: {
        border: `2px dashed ${theme.palette.mediumGray.main}`,
        height: '100%',
        backgroundColor: theme.palette.ligthGray.main,
        zIndex: 9999,
    },
    text: {
        color: theme.palette.mediumGray.main,
    },
});
// @ts-ignore
const useStyles = makeStyles(styles);
const DragZone = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
        <Paper
            elevation={0}
            variant="outlined"
            classes={{ outlined: classes.outlined }}
            // style={{}}
        >
            <Grid
                container
                item
                justifyContent="center"
                alignItems="center"
                style={{ height: '100%' }}
            >
                <Typography className={classes.text}>
                    {formatMessage(DNDMESSAGES.dropHere)}
                </Typography>
            </Grid>
        </Paper>
    );
};

const TestmodalWithHook: FunctionComponent<Props> = ({
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
    const classes = useStyles();

    const user = useCurrentUser();
    const [currentType, setCurrentType] = useState<'create' | 'edit' | 'retry'>(
        type,
    );
    const currentUser = useCurrentUser();
    const [showDropZone, setShowDropzone] = useState<boolean>(false);
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
    const { getRootProps, getInputProps, ...dropZoneProps } = useDropzone({
        // onDrop: onFilesSelect,
        noClick: true,
        autoFocus: false,
        onDrop: (files: File[]) => {
            setFieldTouched('files', true);
            setFieldValue('files', files);
        },
        multiple: true,
        onDragLeave: () => {
            setShowDropzone(false);
        },
        onDragEnter: () => {
            setShowDropzone(true);
        },
        onDropAccepted: () => {
            setShowDropzone(false);
        },
        onDragOver: () => {
            setShowDropzone(true);
        },
    });
    const showChildren = showDropZone ? classes.hidden : classes.visible;
    // const showChildren = classes.visible;
    // const showOverlay = classes.visible;
    const showOverlay = showDropZone ? classes.visible : classes.hidden;
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
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />
                        <div className={classes.cssGridContainer}>
                            <div className={`${classes.layer} ${showOverlay}`}>
                                <DragZone />
                            </div>
                            <div className={`${classes.layer} ${showChildren}`}>
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
                                                    commaSeparatedIdsToArray(
                                                        value,
                                                    ),
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
                                    {/* <FileInputComponent
                                    keyValue="files"
                                    required={currentType === 'edit'}
                                    multiple
                                    onChange={onChange}
                                    value={values.files}
                                    errors={getErrors('files')}
                                    label={MESSAGES.filesUpload}
                                /> */}
                                    {/* <FilesUpload
                                files={values.files ?? []}
                                onFilesSelect={files => {
                                    setFieldTouched('files', true);
                                    setFieldValue('files', files);
                                }}
                            /> */}
                                    <FilesUploadnoState
                                        files={values.files ?? []}
                                        onClick={dropZoneProps.open}
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
                            </div>
                        </div>
                    </div>
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

const modalWithButton = makeFullModal(TestmodalWithHook);

export { modalWithButton as TestmodalWithHook };
