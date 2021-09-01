import React from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { useMutation } from 'react-query';
import { useFormState } from '../../../hooks/form';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { baseUrls } from '../../../constants/urls';
import { redirectTo } from '../../../routing/actions';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';
import { postGeoPkg } from '../requests';

const initialFormState = () => ({
    file: null,
    project: null,
});

const ImportGeoPkgDialog = ({
    renderTrigger,
    sourceId,
    sourceName,
    versionNumber,
    projects,
}) => {
    // eslint-disable-next-line no-unused-vars
    const [form, setFormField, _, setFormState] = useFormState(
        initialFormState(),
    );
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const mutation = useMutation(postGeoPkg);
    const reset = () => {
        setFormState(initialFormState());
    };

    const submit = async (closeDialogCallBack, redirect = false) => {
        const body = {
            file: form.file.value,
            project: form.project.value,
            data_source: sourceId,
            version_number: versionNumber ? versionNumber.toString() : '',
        };
        await mutation.mutateAsync(body);
        closeDialogCallBack();

        if (redirect) {
            dispatch(redirectTo(baseUrls.tasks, {}));
            reset();
        }
    };

    const onConfirm = async closeDialog => {
        await submit(closeDialog);
    };

    const onRedirect = async closeDialog => {
        await submit(closeDialog, true);
    };

    const titleMessage = versionNumber ? (
        <FormattedMessage
            id="update_from_gpkg"
            defaultMessage="Update {sourceName} - {versionNumber}"
            values={{ sourceName, versionNumber }}
        />
    ) : (
        MESSAGES.geoPkgTitle
    );

    const allowConfirm = Boolean(
        !mutation.isLoading && form.file.value && form.project.value,
    );
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            confirmMessage={MESSAGES.launch}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onConfirm={onConfirm}
            onAdditionalButtonClick={onRedirect}
            onClosed={reset}
        >
            {mutation.isLoading && <LoadingSpinner />}
            <Grid container spacing={4}>
                <Grid item>
                    <Typography>
                        <FormattedMessage
                            id="gpkg.explication"
                            defaultMessage="Import OrgUnits from a GeoPackage file, all the OrgUnits present in the file will be updated.
                             The file must be correctly formatted.
                             "
                        />
                    </Typography>
                    <Typography>
                        <FormattedMessage
                            id="import_task_explication"
                            defaultMessage="The import will be realised in the background and can take a dozen minutes to complete."
                        />
                    </Typography>
                </Grid>
                <Grid xs={12} item>
                    <FileInputComponent
                        keyValue="file"
                        value={form.file.value}
                        label={MESSAGES.gpkgFormFile}
                        errors={form.file.errors}
                        required
                        onChange={setFormField}
                    />
                    <InputComponent
                        type="select"
                        keyValue="project"
                        value={form.project.value}
                        errors={form.project.errors}
                        labelString={formatMessage(MESSAGES.project)}
                        options={projects.map(project => ({
                            label: project.name,
                            value: project.id,
                        }))}
                        clearable
                        required
                        onChange={setFormField}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

ImportGeoPkgDialog.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    projects: PropTypes.array.isRequired,
    versionNumber: PropTypes.number,
    sourceId: PropTypes.number.isRequired,
    sourceName: PropTypes.string.isRequired,
};
ImportGeoPkgDialog.defaultProps = {
    versionNumber: null,
};

export { ImportGeoPkgDialog };
