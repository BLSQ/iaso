import React, { useMemo, useCallback, ReactNode, FC } from 'react';
import { Grid, Typography } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import InputComponent from 'Iaso/components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import { baseUrls } from '../../../constants/urls';
import { useFormState } from '../../../hooks/form';
import { useSnackMutation } from '../../../libs/apiHooks';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';
import MESSAGES from '../messages';
import { postGeoPkg } from '../requests';
import { VersionDescription } from './VersionDescription';

type Props = {
    renderTrigger: ReactNode;
    sourceId: string;
    sourceName: string;
    versionNumber: number | null;
};

const initialFormState = () => ({
    file: null,
    project: null,
    versionDescription: '',
    default_valid: false,
});

export const ImportGeoPkgDialog: FC<Props> = ({
    renderTrigger,
    sourceId,
    sourceName,
    versionNumber,
}) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const [form, setFormField, , setFormState] =
        useFormState(initialFormState());

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
                default_valid: form.default_valid.value || false,
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
            form.default_valid.value,
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

    const allowConfirm = Boolean(!mutation.isLoading && form.file.value);

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
                    {!versionNumber && (
                        <VersionDescription
                            formValue={form.versionDescription.value}
                            onChangeDescription={(field, value) => {
                                setFormField(field, value);
                            }}
                        />
                    )}
                    <InputComponent
                        type="checkbox"
                        keyValue="default_valid"
                        labelString={formatMessage(MESSAGES.gpkgValidByDefault)}
                        value={form.default_valid.value}
                        onChange={setFormField}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
