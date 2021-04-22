import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid, Typography, Box } from '@material-ui/core';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import PeriodPicker from '../../periods/components/PeriodPickerComponent';

import MESSAGES from '../messages';
import { createFormVersion } from '../../../utils/requests';
import { useFormState } from '../../../hooks/form';
import { useSafeIntl } from '../../../hooks/intl';
import { Period } from '../../periods/models';
import { getDefaultPeriodString } from '../../periods/utils';

import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../../constants/snackBars';
import { setIsLoadingForm } from '../actions';

const emptyVersion = {
    id: null,
    start_period: getDefaultPeriodString(),
    end_period: Period.next(getDefaultPeriodString()),
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
    const [errorOnPeriods, setErrorOnPeriods] = useState(false);
    const defaultStartPeriod =
        formVersion.start_period || getDefaultPeriodString();
    const [
        formState,
        setFieldValue,
        setFieldErrors,
        setFormState,
    ] = useFormState({
        id: formVersion.id,
        start_period: defaultStartPeriod,
        end_period: formVersion.end_period || Period.next(defaultStartPeriod),
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
                : () => null; // TO-DO => update version
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

    useEffect(() => {
        if (formState.start_period.value && formState.end_period.value) {
            const isValidPeriod = Period.isBefore(
                formState.start_period.value,
                formState.end_period.value,
            );
            if (!isValidPeriod) {
                setErrorOnPeriods(true);
            } else {
                setErrorOnPeriods(false);
            }
        }
    }, [formState.start_period.value, formState.end_period.value]);

    console.log('formState', formState);

    return (
        <ConfirmCancelDialogComponent
            allowConfirm={!errorOnPeriods && Boolean(formState.xls_file.value)}
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
                        hasError={errorOnPeriods}
                        periodType={currentForm.period_type.value}
                        title={intl.formatMessage(MESSAGES.startPeriod)}
                        activePeriodString={formState.start_period.value}
                        onChange={startPeriod =>
                            setFieldValue('start_period', startPeriod)
                        }
                    />
                    <PeriodPicker
                        hasError={errorOnPeriods}
                        periodType={currentForm.period_type.value}
                        title={intl.formatMessage(MESSAGES.endPeriod)}
                        activePeriodString={formState.end_period.value}
                        onChange={endPeriod =>
                            setFieldValue('end_period', endPeriod)
                        }
                    />
                    {errorOnPeriods && (
                        <Box mb={2} mt={-1}>
                            <Typography
                                variant="body1"
                                color="error"
                                fontSize="small"
                            >
                                {intl.formatMessage(
                                    MESSAGES.formVersionPeriodError,
                                )}
                            </Typography>
                        </Box>
                    )}
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
