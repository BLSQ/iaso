import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { useFormState } from '../../../hooks/form';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { baseUrls } from '../../../constants/urls';
import { redirectTo } from '../../../routing/actions';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import MESSAGES from '../messages';
import { useGeoPkgImport } from '../requests';
import InputComponent from '../../../components/forms/InputComponent';

const initialFormState = {
    file: null,
    project: null,
    versionNumber: null,
};

const ImportGeoPkgDialog = ({
    renderTrigger,
    titleMessage,
    sourceId,
    sourceName,
    latestVersion,
    defaultVersion,
}) => {
    // eslint-disable-next-line no-unused-vars
    const [form, setFormField, _, setFormState] =
        useFormState(initialFormState);
    const intl = useSafeIntl();
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [requestBody, setRequestBody] = useState(null);
    const [redirect, setRedirect] = useState(false);
    const [closeDialogCallback, setCloseDialogCallback] = useState(null);
    const importedGeoPkg = useGeoPkgImport(requestBody);

    const dispatch = useDispatch();
    const allProjects = useSelector(state => state.projects.allProjects);

    const submit = useCallback(() => {
        setAllowConfirm(false);
        const body = {
            file: form.file.value,
            project: form.project.value,
            data_source: sourceId,
            version_number: form.versionNumber.value,
        };
        setRequestBody(body);
    }, [
        form.file.value,
        form.project.value,
        sourceId,
        form.versionNumber.value,
    ]);

    const reset = useCallback(() => {
        setRequestBody(null);
        setFormState(initialFormState);
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

    useEffect(() => {
        // not enforcing truthiness of versionNumber as defaultVersion can be null
        if (form.file.value && form.project.value) {
            setAllowConfirm(true);
        } else {
            setAllowConfirm(false);
        }
    }, [
        form.file.value,
        form.project.value,
        form.versionNumber.value,
        // this dep to unlock buttons after successful request
        importedGeoPkg,
    ]);

    useEffect(() => {
        if (importedGeoPkg) {
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
    }, [closeDialogCallback, importedGeoPkg, reset, redirect]);

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
            <Typography variant="subtitle1">{`Data source: ${sourceName}`}</Typography>
            <Grid container spacing={4} style={{ marginTop: '5px' }}>
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
                        options={allProjects.map(project => ({
                            label: project.name,
                            value: project.id,
                        }))}
                        isSearchable
                        clearable
                        required
                        onChange={setFormField}
                    />
                    <InputComponent
                        type="radio"
                        keyValue="versionNumber"
                        value={form.versionNumber.value ?? ''}
                        onChange={setFormField}
                        options={[
                            {
                                value: defaultVersion
                                    ? defaultVersion.toString()
                                    : '',
                                label: 'Use default version',
                            },
                            {
                                value: (latestVersion + 1).toString(),
                                label: 'Create new version',
                            },
                        ]}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

ImportGeoPkgDialog.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
    titleMessage: PropTypes.object.isRequired,
    latestVersion: PropTypes.number.isRequired,
    defaultVersion: PropTypes.number,
    sourceId: PropTypes.number.isRequired,
    sourceName: PropTypes.string.isRequired,
};
ImportGeoPkgDialog.defaultProps = {
    defaultVersion: null,
};

export { ImportGeoPkgDialog };
