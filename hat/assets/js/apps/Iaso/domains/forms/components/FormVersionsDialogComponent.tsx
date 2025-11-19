import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box, Grid, Typography } from '@mui/material';
import {
    IntlMessage,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { ErrorsPopper } from '../../../components/forms/ErrorsPopper';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import { openSnackBar } from '../../../components/snackBars/EventDispatcher';
import { succesfullSnackBar } from '../../../constants/snackBars';
import { useFormState } from '../../../hooks/form';
import { Nullable, Optional } from '../../../types/utils';
import PeriodPicker from '../../periods/components/PeriodPicker';
import { errorTypes, getPeriodsErrors } from '../../periods/utils';
import MESSAGES from '../messages';
import { createFormVersion, updateFormVersion } from '../requests';

const emptyVersion = {
    id: null,
    start_period: null,
    end_period: null,
    xls_file: null,
};

const emptyVersionFromId = (id = null) => ({
    id,
    start_period: null,
    end_period: null,
    xls_file: null,
});

type Props = {
    formVersion?: {
        id: Nullable<Optional<number>>;
        start_period: Nullable<any>;
        end_period: Nullable<any>;
        xls_file: Nullable<any>;
    };
    periodType?: string;
    formId?: number;
    titleMessage: IntlMessage;
    renderTrigger: any;
};

const FormVersionsDialogComponent: FunctionComponent<Props> = ({
    formVersion = emptyVersion,
    formId = 0,
    periodType = '',
    titleMessage,
    ...dialogProps
}) => {
    const intl = useSafeIntl();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [xlsFileErrors, setXlsFileErrors] = useState<any>([]);
    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState({
            id: formVersion.id,
            start_period: formVersion.start_period,
            end_period: formVersion.end_period,
            xls_file: formVersion.xls_file,
        });

    const { formatMessage } = useSafeIntl();

    const periodsErrors: any = useMemo(
        () =>
            getPeriodsErrors(
                formState.start_period.value,
                formState.end_period.value,
                periodType,
            ),
        [formState.end_period.value, formState.start_period.value, periodType],
    );

    const onConfirm = useCallback(
        async closeDialog => {
            if (!isLoading) {
                setIsLoading(true);
                let savePromise;
                const data: Record<string, any> = {
                    form_id: formId,
                };
                if (formState.start_period.value) {
                    data.start_period = formState.start_period.value;
                }
                if (formState.end_period.value) {
                    data.end_period = formState.end_period.value;
                }
                if (!formVersion.id) {
                    savePromise = createFormVersion({
                        xls_file: formState.xls_file.value,
                        data,
                    });
                } else {
                    data.id = formVersion.id;
                    savePromise = updateFormVersion(data);
                }
                try {
                    await savePromise;
                    closeDialog();
                    setIsLoading(false);
                    // FIXME TS seems to think formVersion.id is always either null or undefined
                    setFormState(emptyVersionFromId(formVersion.id));
                    openSnackBar(succesfullSnackBar());
                    queryClient.invalidateQueries([
                        'formVersions',
                        `formVersions-${formId}`,
                    ]);
                } catch (error) {
                    setIsLoading(false);
                    if (error.status === 400) {
                        Object.entries(error.details).forEach(entry => {
                            const entryKey = entry[0];
                            const entryValue: any = entry[1];
                            if (entryKey === 'xls_file_validation_errors') {
                                setXlsFileErrors(
                                    entryValue.map(err => err.message),
                                );
                            } else {
                                setFieldErrors(entryKey, entryValue);
                            }
                        });
                    }
                }
            }
        },
        [
            isLoading,
            formId,
            formState.start_period.value,
            formState.end_period.value,
            formState.xls_file.value,
            formVersion.id,
            setFormState,
            queryClient,
            setFieldErrors,
        ],
    );
    const handleCancel = closeDialog => {
        setFormState({
            id: formVersion.id,
            start_period: formVersion.start_period,
            end_period: formVersion.end_period,
            xls_file: formVersion.xls_file,
        });
        closeDialog();
    };
    const allowConfirm = () => {
        return Boolean(
            !isLoading &&
                !periodsErrors.start &&
                !periodsErrors.end &&
                ((!formState.id.value && formState.xls_file.value) ||
                    formState.id.value),
        );
    };
    const startPeriodInvalid =
        periodsErrors.start && periodsErrors.start.invalid;
    const endPeriodInvalid = periodsErrors.end && periodsErrors.end.invalid;
    const chronologicalError =
        (periodsErrors.start && periodsErrors.start.chronological) ||
        (periodsErrors.end && periodsErrors.end.chronological);
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <ConfirmCancelDialogComponent
                allowConfirm={allowConfirm()}
                onCancel={handleCancel}
                maxWidth="sm"
                titleMessage={titleMessage}
                onConfirm={onConfirm}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                {...dialogProps}
            >
                <Grid container spacing={4} justifyContent="flex-start">
                    <Grid xs={12} item>
                        {!formState.id.value && (
                            <Box mt={1} mb="4px">
                                <FileInputComponent
                                    keyValue="xls_file"
                                    onChange={(key, value) => {
                                        setXlsFileErrors([]);
                                        setFieldValue(key, value);
                                    }}
                                    value={formState.xls_file.value}
                                    label={MESSAGES.xls_form_file}
                                    errors={formState.xls_file.errors}
                                    required
                                />
                                <ErrorsPopper
                                    errors={xlsFileErrors}
                                    errorCountMessage={formatMessage(
                                        MESSAGES.validationErrorCount,
                                        {
                                            count: xlsFileErrors.length,
                                        },
                                    )}
                                />
                            </Box>
                        )}

                        {!formState.id.value && (
                            <span>
                                {intl.formatMessage(MESSAGES.validateXlsForm)}
                                <a
                                    href="https://getodk.org/xlsform/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {intl.formatMessage(
                                        MESSAGES.validateXLSFormLink,
                                    )}
                                </a>
                            </span>
                        )}
                        <PeriodPicker
                            keyName="startPeriod"
                            hasError={Boolean(periodsErrors.start)}
                            periodType={periodType}
                            title={intl.formatMessage(MESSAGES.startPeriod)}
                            activePeriodString={
                                !startPeriodInvalid
                                    ? formState.start_period.value
                                    : null
                            }
                            onChange={startPeriod =>
                                setFieldValue('start_period', startPeriod)
                            }
                        />
                        {startPeriodInvalid && (
                            <Box mb={2} mt={-1}>
                                <Typography
                                    id="start-invalid"
                                    variant="body1"
                                    color="error"
                                    fontSize="small"
                                >
                                    {intl.formatMessage(
                                        errorTypes.invalid.message,
                                    )}
                                </Typography>
                            </Box>
                        )}
                        <PeriodPicker
                            keyName="endPeriod"
                            hasError={Boolean(periodsErrors.end)}
                            periodType={periodType}
                            title={intl.formatMessage(MESSAGES.endPeriod)}
                            activePeriodString={
                                !endPeriodInvalid
                                    ? formState.end_period.value
                                    : null
                            }
                            onChange={endPeriod =>
                                setFieldValue('end_period', endPeriod)
                            }
                        />
                        {endPeriodInvalid && (
                            <Box mb={2} mt={-1}>
                                <Typography
                                    id="end-invalid"
                                    variant="body1"
                                    color="error"
                                    fontSize="small"
                                >
                                    {intl.formatMessage(
                                        errorTypes.invalid.message,
                                    )}
                                </Typography>
                            </Box>
                        )}
                        {chronologicalError && (
                            <Box mb={2} mt={-1}>
                                <Typography
                                    id="chronological-error"
                                    variant="body1"
                                    color="error"
                                    fontSize="small"
                                >
                                    {intl.formatMessage(
                                        errorTypes.chronological.message,
                                    )}
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        </>
    );
};

export default FormVersionsDialogComponent;
