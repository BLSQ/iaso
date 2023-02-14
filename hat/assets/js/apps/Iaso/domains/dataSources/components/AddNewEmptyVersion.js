import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import PropTypes from 'prop-types';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { createSourceVersion } from '../requests';
import { useFormState } from '../../../hooks/form';
import { useSnackMutation } from '../../../libs/apiHooks.ts';
import InputComponent from '../../../components/forms/InputComponent';

const initialFormState = () => {
    return {
        versionDescription: '',
    };
};

const AddNewEmptyVersion = ({ renderTrigger, sourceId }) => {
    const { formatMessage } = useSafeIntl();
    // eslint-disable-next-line no-unused-vars
    const [form, setFormField, _, setFormState] = useFormState(
        initialFormState(),
    );

    const mutation = useSnackMutation(
        createSourceVersion,
        MESSAGES.newEmptyVersionSavedSuccess,
        MESSAGES.newEmptyVersionError,
    );

    const reset = () => {
        setFormState(initialFormState());
    };

    const submit = async closeDialogCallBack => {
        const body = {
            dataSourceId: sourceId,
            description: form.versionDescription.value || null,
        };
        await mutation.mutateAsync(body);
        closeDialogCallBack();
        reset();
    };

    const onConfirm = async closeDialog => {
        await submit(closeDialog);
    };

    const onRedirect = async closeDialog => {
        await submit(closeDialog);
    };

    const titleMessage = (
        <FormattedMessage
            id="iaso.sourceVersion.label.createNewEmptyVersion"
            defaultMessage="Create a new empty version"
        />
    );

    const allowConfirm = !mutation.isLoading;

    const renderDefaultLayout = versionNumber => {
        return (
            <>
                {!versionNumber && (
                    <InputComponent
                        type="text"
                        keyValue="versionDescription"
                        labelString={formatMessage(
                            MESSAGES.dataSourceDescription,
                        )}
                        value={form.versionDescription.value}
                        onChange={(field, value) => {
                            setFormField(field, value);
                        }}
                    />
                )}
            </>
        );
    };

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onClosed={reset}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
            additionalButton
            onAdditionalButtonClick={onRedirect}
        >
            {mutation.isLoading && <LoadingSpinner />}

            <Grid container spacing={4}>
                <Grid item>
                    <Typography>
                        <FormattedMessage
                            id="iaso.sourceVersion.label.create_empty_version_explication"
                            defaultMessage="It will directly create a new empty version."
                        />
                    </Typography>
                </Grid>

                <Grid xs={12} item>
                    {renderDefaultLayout()}
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

AddNewEmptyVersion.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    sourceId: PropTypes.number.isRequired,
};

export { AddNewEmptyVersion };
