import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import PropTypes from 'prop-types';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { useCreateSourceVersion } from '../requests';
import { useFormState } from '../../../hooks/form';
import InputComponent from '../../../components/forms/InputComponent';

const initialFormState = () => {
    return {
        versionDescription: '',
    };
};

const VersionDescription = ({ formValue, onChangeDescription }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <InputComponent
            type="text"
            keyValue="versionDescription"
            labelString={formatMessage(MESSAGES.dataSourceDescription)}
            value={formValue}
            onChange={(field, value) => {
                onChangeDescription(field, value);
            }}
        />
    );
};

const AddNewEmptyVersion = ({
    renderTrigger,
    sourceId,
    forceRefreshParent,
}) => {
    // eslint-disable-next-line no-unused-vars
    const [form, setFormField, , setFormState] = useFormState(
        initialFormState(),
    );
    const { mutateAsync: createSourceVersion } = useCreateSourceVersion();

    const reset = () => {
        setFormState(initialFormState());
    };

    const submit = async closeDialogCallBack => {
        const body = {
            dataSourceId: sourceId,
            description: form.versionDescription.value || null,
        };
        await createSourceVersion(body);
        closeDialogCallBack();
        forceRefreshParent();
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

    const allowConfirm = !createSourceVersion.isLoading;
    const onChangeDescription = (field, value) => {
        setFormField(field, value);
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
            {createSourceVersion.isLoading && <LoadingSpinner />}

            <Grid container spacing={4}>
                <Grid item>
                    <Typography>
                        <FormattedMessage
                            id="iaso.sourceVersion.label.createEmptyVersionDescription"
                            defaultMessage="It will directly create a new empty version."
                        />
                    </Typography>
                </Grid>

                <Grid xs={12} item>
                    <VersionDescription
                        formValue={form.versionDescription.value}
                        onChangeDescription={onChangeDescription}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

AddNewEmptyVersion.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    sourceId: PropTypes.number.isRequired,
    forceRefreshParent: PropTypes.func.isRequired,
};

VersionDescription.propTypes = {
    formValue: PropTypes.string.isRequired,
    onChangeDescription: PropTypes.func.isRequired,
};

export { AddNewEmptyVersion };
