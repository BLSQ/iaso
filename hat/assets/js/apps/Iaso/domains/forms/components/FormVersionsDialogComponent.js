import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import PeriodPicker from '../../periods/components/PeriodPickerComponent';

import MESSAGES from '../messages';
import { createFormVersion } from '../../../utils/requests';
import { useFormState } from '../../../hooks/form';
import { useSafeIntl } from '../../../hooks/intl';

import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../../constants/snackBars';
import { setIsLoadingForm } from '../actions';

const emptyVersion = {
    id: null,
    start_period: null,
    end_period: null,
    version_id: null,
    xls_file: null,
};

const FormVersionsDialogComponent = ({
    formVersion,
    titleMessage,
    onConfirmed,
    currentForm,
    ...dialogProps
}) => {
    const dispatch = useDispatch();
    const intl = useSafeIntl();

    const [
        formState,
        setFieldValue,
        setFieldErrors,
        setFormState,
    ] = useFormState({
        id: formVersion.id,
        start_period: formVersion.start_period,
        end_period: formVersion.short_name,
        version_id: formVersion.version_id,
        xls_file: formVersion.xls_file,
    });

    const onConfirm = useCallback(
        async closeDialog => {
            dispatch(setIsLoadingForm(true));
            const savePromise = !formVersion.id
                ? createFormVersion(dispatch, {
                      xls_file: formState.xls_file.value,
                      data: {
                          form_id: currentForm.id.value,
                          version_id: formState.version_id.value,
                      },
                  })
                : () => null;
            try {
                await savePromise;
                closeDialog();
                onConfirmed();
                setFormState(emptyVersion);
                dispatch(enqueueSnackbar(succesfullSnackBar()));
            } catch (error) {
                if (error.status === 400) {
                    Object.entries(error.details).forEach(entry =>
                        setFieldErrors(entry[0], entry[1]),
                    );
                }
            }
            dispatch(setIsLoadingForm(false));
        },
        [dispatch, setFieldErrors, formState],
    );
    return (
        <ConfirmCancelDialogComponent
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            onCancel={closeDialog => {
                setFormState(emptyVersion);
                closeDialog();
            }}
            {...dialogProps}
        >
            <Grid container spacing={4} justify="flex-start">
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="version_id"
                        onChange={setFieldValue}
                        value={formState.version_id.value}
                        errors={formState.version_id.errors}
                        type="text"
                        label={MESSAGES.version}
                    />
                    <PeriodPicker
                        periodType={currentForm.period_type.value}
                        title={intl.formatMessage(MESSAGES.startPeriod)}
                    />
                    <PeriodPicker
                        periodType={currentForm.period_type.value}
                        title={intl.formatMessage(MESSAGES.endPeriod)}
                    />
                    {!formState.id.value && (
                        <FileInputComponent
                            keyValue="xls_file"
                            onChange={setFieldValue}
                            value={formState.xls_file.value}
                            label={MESSAGES.xls_form_file}
                            errors={formState.xls_file.errors}
                            required
                        />
                    )}
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

FormVersionsDialogComponent.defaultProps = {
    formVersion: emptyVersion,
};

FormVersionsDialogComponent.propTypes = {
    formVersion: PropTypes.object,
    currentForm: PropTypes.object.isRequired,
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    onConfirmed: PropTypes.func.isRequired,
};
export default FormVersionsDialogComponent;
