import React, { useCallback } from 'react';
import { Grid } from '@material-ui/core';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useFormState } from 'Iaso/hooks/form';
import ConfirmCancelDialogComponent from 'Iaso/components/dialogs/ConfirmCancelDialogComponent';
import FileInputComponent from 'Iaso/components/forms/FileInputComponent';
import { enqueueSnackbar } from 'Iaso/redux/snackBarsReducer';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { postRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';

const initialFormState = () => ({
    file: null,
});

const MESSAGES = defineMessages({
    import_file: {
        id: 'iaso.polio.import_file.label',
        defaultMessage: 'Excel Line File',
    },
    title: {
        id: 'iaso.polio.import_line_list',
        defaultMessage: 'Import Line List',
    },
    successMessage: {
        id: 'iaso.polio.import_line_list.successMessage',
        defaultMessage: 'Imported successfully {amount} campaign(s)',
    },
});

const postLineListFile = async content =>
    postRequest('/api/polio/linelistimport/', {}, { file: content.file });

const ImportLineListDialog = ({ renderTrigger }) => {
    const [form, setFormField, setFieldErrors, setFormState] = useFormState(
        initialFormState(),
    );
    const { formatMessage } = useSafeIntl();

    const { mutateAsync, isLoading } = useSnackMutation(postLineListFile);
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    const reset = useCallback(() => {
        setFormState(initialFormState());
    }, [setFormState]);

    const onConfirm = async closeDialog => {
        try {
            const res = await mutateAsync({
                file: form.file.value,
            });
            queryClient.invalidateQueries(['polio', 'campaigns']);
            // FIXME persistant success snackbar have no close button
            dispatch(
                enqueueSnackbar({
                    messageObject: formatMessage(MESSAGES.successMessage, {
                        amount: res.import_result.created,
                    }),
                    options: {
                        variant: 'success',
                        persist: false,
                    },
                }),
            );
            closeDialog();
            reset();
        } catch (error) {
            if (error.status === 400) {
                Object.entries(error.details).forEach(
                    ([errorKey, errorMessages]) => {
                        setFieldErrors(errorKey, errorMessages);
                    },
                );
            }
        }
    };

    const allowConfirm = Boolean(!isLoading && form.file.value);
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={MESSAGES.title}
            maxWidth="sm"
            allowConfirm={allowConfirm}
            onConfirm={onConfirm}
            onClosed={reset}
        >
            {isLoading && <LoadingSpinner />}
            <Grid container spacing={4}>
                <Grid xs={12} item>
                    <FileInputComponent
                        keyValue="file"
                        value={form.file.value}
                        label={MESSAGES.import_file}
                        errors={form.file.errors}
                        required
                        onChange={setFormField}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

ImportLineListDialog.propTypes = {
    renderTrigger: PropTypes.func.isRequired,
};
ImportLineListDialog.defaultProps = {};

export default ImportLineListDialog;
