import { Grid, Typography } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import PropTypes from 'prop-types';
import React, { useMemo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import InputComponent from '../../../components/forms/InputComponent.tsx';
import { baseUrls } from '../../../constants/urls.ts';
import { useFormState } from '../../../hooks/form';
import { useSnackMutation } from '../../../libs/apiHooks.ts';
import MESSAGES from '../messages';
import { postGeoPkg } from '../requests';
import { VersionDescription } from './VersionDescription.tsx';
import { userHasPermission } from '../../users/utils';
import * as Permission from '../../../utils/permissions.ts';
import { useCurrentUser } from '../../../utils/usersUtils';

const initialFormState = () => ({
    file: null,
    project: null,
    versionDescription: '',
});

const ImportGeoPkgDialog = ({
    renderTrigger,
    sourceId,
    sourceName,
    versionNumber,
    projects,
}) => {
    const currentUser = useCurrentUser();
    const [form, setFormField, , setFormState] =
        useFormState(initialFormState());
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();

    const mutation = useSnackMutation(
        postGeoPkg,
        MESSAGES.importGpkgSuccess,
        MESSAGES.importGpkgError,
    );
    const reset = useCallback(() => {
        setFormState(initialFormState());
    }, [setFormState]);

    const submit = useCallback(
        async (closeDialogCallBack, redirect = false) => {
            const body = {
                file: form.file.value,
                project: form.project.value,
                data_source: sourceId,
                version_number:
                    versionNumber !== null && versionNumber !== undefined
                        ? versionNumber.toString()
                        : '',
                description: form.versionDescription.value || '',
            };
            await mutation.mutateAsync(body);
            closeDialogCallBack();

            if (redirect) {
                reset();
                redirectTo(baseUrls.tasks);
            }
        },
        [
            form.file.value,
            form.project.value,
            form.versionDescription.value,
            mutation,
            redirectTo,
            reset,
            sourceId,
            versionNumber,
        ],
    );

    const onConfirm = async closeDialog => {
        await submit(closeDialog);
    };

    const onRedirect = useCallback(
        async closeDialog => {
            await submit(closeDialog, true);
        },
        [submit],
    );

    const titleMessage = versionNumber ? (
        <FormattedMessage
            id="iaso.datasource.gpkg.title.update"
            defaultMessage="Update {sourceName} - {versionNumber}"
            values={{ sourceName, versionNumber }}
        />
    ) : (
        MESSAGES.gpkgTitle
    );

    const allowConfirm = Boolean(
        !mutation.isLoading && form.file.value && form.project.value,
    );

    const hasTaskPermission = userHasPermission(
        Permission.DATA_TASKS,
        currentUser,
    );

    const additionalButtonProps = useMemo(
        () =>
            hasTaskPermission
                ? {
                      additionalButton: true,
                      additionalMessage: MESSAGES.goToCurrentTask,
                      onAdditionalButtonClick: onRedirect,
                  }
                : {},
        [hasTaskPermission, onRedirect],
    );
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            confirmMessage={MESSAGES.launch}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
            onConfirm={onConfirm}
            onClosed={reset}
            {...additionalButtonProps}
        >
            {mutation.isLoading && <LoadingSpinner />}
            <Grid container spacing={4}>
                <Grid item>
                    <Typography>
                        <FormattedMessage
                            id="iaso.datasources.gpkg.explication"
                            // eslint-disable-next-line max-len
                            defaultMessage="Import OrgUnits from a GeoPackage file, all the OrgUnits present in the file will be updated.{breakingLine}The file must be correctly formatted.{breakingLine}"
                            values={{ breakingLine: <br /> }}
                        />
                    </Typography>
                    <Typography>
                        <FormattedMessage
                            id="iaso.datasources.gpkg.importTaskExplication"
                            defaultMessage="The import will be processed in the background and can take a dozen minutes to complete."
                        />
                    </Typography>
                </Grid>
                <Grid xs={12} item>
                    <FileInputComponent
                        keyValue="file"
                        value={form.file.value}
                        label={MESSAGES.gpkgChooseFile}
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
                    {!versionNumber && (
                        <VersionDescription
                            formValue={form.versionDescription.value}
                            onChangeDescription={(field, value) => {
                                setFormField(field, value);
                            }}
                        />
                    )}
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
