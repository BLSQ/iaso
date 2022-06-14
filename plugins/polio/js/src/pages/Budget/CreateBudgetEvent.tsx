import React, { FunctionComponent, useCallback, useState } from 'react';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
// @ts-ignore
import { AddButton, useSafeIntl } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
import { useGetTeams as useGetTeamsOptions } from '../../../../../../hat/assets/js/apps/Iaso/domains/plannings/hooks/requests/useGetTeams';
import MESSAGES from '../../constants/messages';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { commaSeparatedIdsToArray } from '../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { useSaveBudgetEvent } from '../../hooks/useSaveBudgetEvent';
import FileInputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/FileInputComponent';
import { useBudgetEvenValidation } from './hooks/validation';

type Props = {
    campaignId: string;
};

const renderTrigger = ({ openDialog }) => {
    return (
        <AddButton
            onClick={openDialog}
            dataTestId="create-budgetStep-button"
            message={MESSAGES.addStep}
        />
    );
};

export const CreateBudgetEvent: FunctionComponent<Props> = ({ campaignId }) => {
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsOptions();
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetEvent } = useSaveBudgetEvent();
    const [closeModal, setCloseModal] = useState<any>();
    const validationSchema = useBudgetEvenValidation();

    const formik = useFormik({
        initialValues: {
            campaign: campaignId,
            author: currentUser.id,
            target_teams: [],
            type: null,
            cc_emails: null,
            comment: null,
            files: null,
            links: null,
            status: 'validation_ongoing', // TODO status should be handled by backend
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema,
        onSubmit: values =>
            saveBudgetEvent(values, {
                onSuccess: () => {
                    closeModal.closeDialog();
                    resetForm();
                },
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
    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={MESSAGES.sendFiles}
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
                renderTrigger={renderTrigger}
            >
                <InputComponent
                    type="select"
                    required
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
                    type="select"
                    required
                    keyValue="target_teams"
                    multi
                    onChange={(keyValue, value) => {
                        onChange(keyValue, commaSeparatedIdsToArray(value));
                    }}
                    value={values.target_teams}
                    errors={getErrors('target_teams')}
                    label={MESSAGES.destination}
                    options={teamsDropdown}
                    loading={isFetchingTeams}
                />
                <FileInputComponent
                    keyValue="files"
                    required
                    multiple
                    onChange={onChange}
                    value={values.files}
                    errors={getErrors('files')}
                    label={MESSAGES.filesUpload}
                />
                <InputComponent
                    type="text"
                    keyValue="comment"
                    multiline
                    onChange={onChange}
                    value={values.comment}
                    errors={getErrors('comment')}
                    label={MESSAGES.note}
                />
                <InputComponent
                    type="email"
                    keyValue="cc_emails"
                    onChange={onChange}
                    value={values.cc_emails}
                    errors={getErrors('cc_emails')}
                    label={MESSAGES.cc_emails}
                />
                <InputComponent
                    type="text"
                    keyValue="links"
                    multiline
                    onChange={onChange}
                    value={values.links}
                    errors={getErrors('links')}
                    label={MESSAGES.links}
                />
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
