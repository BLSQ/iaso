import React, { FunctionComponent, useCallback } from 'react';
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

    const formik = useFormik({
        initialValues: {
            campaign: campaignId,
            author: currentUser.id,
            target_teams: [],
            type: null,
            cced_emails: null,
            comments: null,
            file: null,
            status: 'validation_ongoing', // TODO status should be handled by backend
        },
        enableReinitialize: true,
        validateOnBlur: true,
        // validationSchema: schema,
        onSubmit: values => saveBudgetEvent(values),
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
                    closeDialog();
                    handleSubmit();
                }}
                onCancel={closeDialog => {
                    closeDialog();
                    resetForm();
                }}
                maxWidth="sm"
                cancelMessage={MESSAGES.cancel}
                renderTrigger={renderTrigger}
            >
                <FileInputComponent
                    keyValue="file"
                    required
                    onChange={onChange}
                    value={values.file}
                    errors={getErrors('file')}
                    label={MESSAGES.eventType}
                />
                <InputComponent
                    type="select"
                    required
                    keyValue="type"
                    onChange={onChange}
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
                            label: formatMessage(MESSAGES.note),
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
                <InputComponent
                    type="text"
                    keyValue="comments"
                    multiline
                    onChange={onChange}
                    value={values.comments}
                    errors={getErrors('comments')}
                    label={MESSAGES.note}
                />
                <InputComponent
                    type="email"
                    keyValue="cced_emails"
                    onChange={onChange}
                    value={values.cced_emails}
                    errors={getErrors('cced_emails')}
                    label={MESSAGES.cced_emails}
                />
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
