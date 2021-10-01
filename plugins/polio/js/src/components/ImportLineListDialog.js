import React, { useCallback } from 'react';
import { Grid } from '@material-ui/core';
import { LoadingSpinner } from 'bluesquare-components';
import { useMutation, useQueryClient } from 'react-query';
import { defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useFormState } from '../../../../../hat/assets/js/apps/Iaso/hooks/form';
import ConfirmCancelDialogComponent from '../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
import { iasoPostRequest } from '../../../../../hat/assets/js/apps/Iaso/utils/requests';
import FileInputComponent from '../../../../../hat/assets/js/apps/Iaso/components/forms/FileInputComponent';
import { enqueueSnackbar } from '../../../../../hat/assets/js/apps/Iaso/redux/snackBarsReducer';

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
    },
});

const postLineListFile = async content =>
    iasoPostRequest({
        requestParams: {
            url: '/api/polio/linelistimport/',
            body: {},
            fileData: { file: content.file },
        },
        disableSuccessSnackBar: true,
    });

const ImportLineListDialog = ({ renderTrigger }) => {
    const [form, setFormField, setFieldErrors, setFormState] = useFormState(
        initialFormState(),
    );

    const { mutateAsync, isLoading } = useMutation(postLineListFile);
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
            // FIXME: Snackbar is bugging and want to format itself but don't pass value
            // FIXME persistant success snackbare have no close button
            const message = `Imported successfully ${res.import_result.created} campaign(s)`;
            dispatch(
                enqueueSnackbar({
                    messageObject: {
                        id: 'successMessage',
                        defaultMessage: message,

                        // TODO uncomment when snackbar bug is fixed
                        //     defaultMessage:
                        //         'Imported successfully {amount} campaign(s)',
                        //     values: { amount: res.import_result.created },
                    },
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
