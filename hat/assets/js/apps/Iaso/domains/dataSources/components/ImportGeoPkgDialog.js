import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { useFormState } from '../../../hooks/form';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { baseUrls } from '../../../constants/urls';
import { redirectTo } from '../../../routing/actions';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import MESSAGES from '../messages';
import { useGeoPkgImport } from '../requests';
import InputComponent from '../../../components/forms/InputComponent';

const initialFormState = () => {
    return {
        file: null,
        project: null,
    };
};

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
    const intl = useSafeIntl();
    const [requestBody, setRequestBody] = useState(null);
    const [redirect, setRedirect] = useState(false);
    const [closeDialogCallback, setCloseDialogCallback] = useState(null);
    const { data, isLoading } = useGeoPkgImport(requestBody);
    const dispatch = useDispatch();

    const submit = useCallback(() => {
        const body = {
            file: form.file.value,
            project: form.project.value,
            data_source: sourceId,
            version_number: versionNumber ? versionNumber.toString() : '',
        };
        setRequestBody(body);
    }, [form.file.value, form.project.value, sourceId]);

    const reset = useCallback(() => {
        setRequestBody(null);
        setFormState(initialFormState());
    }, [setFormState]);

    const onConfirm = useCallback(
        closeDialog => {
            submit();
            setCloseDialogCallback(() => closeDialog);
        },
        [submit],
    );
    const onRedirect = useCallback(
        closeDialog => {
            onConfirm(closeDialog);
            setRedirect(true);
        },
        [onConfirm],
    );

    const allowConfirm = Boolean(
        !isLoading && form.file.value && form.project.value,
    );

    useEffect(() => {
        if (data) {
            closeDialogCallback();
            if (redirect) {
                dispatch(
                    redirectTo(baseUrls.tasks, {
                        order: '-created_at',
                    }),
                );
            }
            reset();
        }
    }, [closeDialogCallback, data, reset, redirect]);

    const titleMessage = versionNumber ? (
        <FormattedMessage
            id="update_from_gpkg"
            defaultMessage="Update {sourceName} - version"
            values={{ sourceName, versionNumber }}
        />
    ) : (
        MESSAGES.geoPkgTitle
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
            {isLoading && <LoadingSpinner />}
            <Grid container spacing={4} style={{ marginTop: '5px' }}>
                <Grid item>
                    <Typography>
                        <FormattedMessage
                            id="gpkg.explication"
                            defaultMessage="Import Orgunit from a GeoPackage file. The file must be correctly formatted. "
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
                        labelString={intl.formatMessage(MESSAGES.project)}
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
