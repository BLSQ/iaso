import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import PropTypes from 'prop-types';
import MESSAGES from '../messages';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { useCreateSourceVersion } from '../requests';
import { useFormState } from '../../../hooks/form';
import { VersionDescription } from './VersionDescription';

const initialFormState = { versionDescription: '' };

const AddNewEmptyVersion = ({
    renderTrigger,
    sourceId,
    forceRefreshParent,
}) => {
    // eslint-disable-next-line no-unused-vars
    const [form, setFormField, , setFormState] = useFormState(initialFormState);
    const { mutateAsync: createSourceVersion } = useCreateSourceVersion();

    const reset = () => {
        setFormState(initialFormState);
    };

    const submit = async closeDialogCallBack => {
        const body = {
            dataSourceId: sourceId,
            description: form.versionDescription.value || null,
        };
        await createSourceVersion(body);
        closeDialogCallBack();
        reset();
        forceRefreshParent();
    };

    const onConfirm = async closeDialog => {
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


export { AddNewEmptyVersion };
