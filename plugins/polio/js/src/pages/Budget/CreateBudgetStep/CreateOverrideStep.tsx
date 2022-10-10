/* eslint-disable react/require-default-props */
/* eslint-disable react/no-unused-prop-types */
import React, { FunctionComponent } from 'react';
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
import { Box, Typography } from '@material-ui/core';
import MESSAGES from '../../../constants/messages';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

import { useBudgetStepOverrideValidation } from '../hooks/validation';
import {
    useGetTeamsDropDown,
    useUserHasTeam,
} from '../../../hooks/useGetTeams';

import {
    useTranslatedErrors,
    useApiErrorValidation,
} from '../../../../../../../hat/assets/js/apps/Iaso/libs/validation';
import { useSaveBudgetStep } from '../hooks/api/useSaveBudgetStep';
import { AddStepButton } from './AddStepButton';
import { commaSeparatedIdsToArray } from '../../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { useGetStatusDropDown } from '../hooks/api/useGetStatusDropDown';
import { UserHasTeamWarning } from './UserHasTeamWarning';

type Props = {
    campaignId: string;
    transitionKey: string;
    transitionLabel: string;
    closeDialog: () => void;
    isOpen: boolean;
    id?: string;
    isMobileLayout?: boolean;
};

const CreateOverrideStep: FunctionComponent<Props> = ({
    campaignId,
    closeDialog,
    isOpen,
    transitionKey,
    transitionLabel,
    id = '',
}) => {
    const currentUser = useCurrentUser();
    const { data: userHasTeam } = useUserHasTeam(currentUser?.user_id);
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveBudgetStep } = useSaveBudgetStep();
    const { data: teamOptions, isFetching: isFetchingTeams } =
        useGetTeamsDropDown();
    const { data: stepOptions, isFetching: isFetchingStepOptions } =
        useGetStatusDropDown();

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<any>, any>({
        mutationFn: saveBudgetStep,
    });
    const validationSchema = useBudgetStepOverrideValidation(
        apiErrors,
        payload,
    );
    const formik = useFormik({
        initialValues: {
            transition_key: transitionKey,
            campaign: campaignId,
            comment: null,
            files: null,
            links: null,
            amount: null,
            target_teams: [],
            transition: null,
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

    const titleMessage = transitionLabel;
    // const titleMessage = MESSAGES.newBudgetStep;

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
                        resetForm();
                    }
                }}
                maxWidth="sm"
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.send}
                open={isOpen}
                closeDialog={closeDialog}
                id={id}
                dataTestId="Test-modal"
                onClose={() => null}
            >
                {userHasTeam && (
                    <>
                        <>
                            <InputComponent
                                type="select"
                                required
                                keyValue="type"
                                onChange={(keyValue, value) => {
                                    onChange(keyValue, value);
                                }}
                                value={values.type}
                                errors={getErrors('type')}
                                label={MESSAGES.eventType}
                                options={stepOptions}
                                loading={isFetchingStepOptions}
                            />
                            <InputComponent
                                type="text"
                                keyValue="comment"
                                multiline
                                onChange={onChange}
                                value={values.comment}
                                errors={getErrors('comment')}
                                label={MESSAGES.notes}
                            />
                            <InputComponent
                                type="number"
                                keyValue="amount"
                                onChange={onChange}
                                value={values.amount}
                                errors={getErrors('amount')}
                                label={MESSAGES.amount}
                            />
                        </>

                        <Box mt={2}>
                            <FilesUpload
                                files={values.files ?? []}
                                onFilesSelect={files => {
                                    setFieldTouched('files', true);
                                    setFieldValue('files', files);
                                }}
                            />
                        </Box>

                        <InputComponent
                            type="text"
                            keyValue="links"
                            multiline
                            onChange={onChange}
                            value={values.links}
                            errors={getErrors('links')}
                            label={MESSAGES.links}
                        />
                        <InputComponent
                            type="select"
                            required
                            keyValue="target_teams"
                            multi
                            onChange={(keyValue, value) => {
                                onChange(
                                    keyValue,
                                    commaSeparatedIdsToArray(value),
                                );
                            }}
                            value={values.target_teams}
                            errors={getErrors('target_teams')}
                            label={MESSAGES.destination}
                            options={teamOptions}
                            loading={isFetchingTeams}
                        />
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
                {/* TODO put in own component */}
                {!userHasTeam && <UserHasTeamWarning />}
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(CreateOverrideStep, AddStepButton);

export { modalWithButton as CreateOverrideStep };
