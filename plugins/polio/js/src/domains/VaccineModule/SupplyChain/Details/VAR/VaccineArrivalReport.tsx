import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent, useCallback, useMemo, useRef } from 'react';
import { DeleteIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import {
    DropdownOptions,
    Optional,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { NumberInput, Select } from '../../../../../components/Inputs';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { VAR } from '../../constants';
import MESSAGES from '../../messages';
import { SupplyChainFormData } from '../../types';
import { usePaperStyles } from '../shared';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';

type Props = {
    index: number;
    dosesForVaccineOptions: DropdownOptions<number>[];
};

export const VaccineArrivalReport: FunctionComponent<Props> = ({
    index,
    dosesForVaccineOptions,
}) => {
    const classes: Record<string, string> = usePaperStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setFieldTouched, setValues } =
        useFormikContext<SupplyChainFormData>();
    const { arrival_reports } = values as SupplyChainFormData;
    const markedForDeletion = arrival_reports?.[index].to_delete ?? false;

    // Use refs to track focused state to reduce renders and avoid sluggish UI
    const dosesReceivedRef = useRef<boolean>(false);
    const vialsReceivedRef = useRef<boolean>(false);
    const dosesShippedRef = useRef<boolean>(false);
    const vialsShippedRef = useRef<boolean>(false);

    const defaultDosesPerVial =
        dosesForVaccineOptions.length === 1
            ? dosesForVaccineOptions[0].value
            : undefined;
    const doses_per_vial =
        arrival_reports?.[index].doses_per_vial ?? defaultDosesPerVial;
    const poNumberOptions = useMemo(() => {
        return (
            (
                values.pre_alerts
                    ?.filter(
                        preAlert =>
                            preAlert.po_number && preAlert.doses_shipped,
                    )
                    .map(preAlert => ({
                        label: preAlert.po_number,
                        value: preAlert.po_number,
                    })) || []
            )
                // remove already selected numbers from dropdown
                .filter(option => {
                    return !(values?.arrival_reports ?? [])
                        .map(report =>
                            report.po_number
                                ? `${report.po_number}`
                                : undefined,
                        )
                        .includes(option.value);
                })
        );
    }, [values?.arrival_reports, values.pre_alerts]);

    const handleChangePoNumber = useCallback(
        (key, value) => {
            const preAlert = values.pre_alerts?.find(
                pre => pre.po_number === value,
            );
            if (preAlert) {
                setFieldValue(
                    `${VAR}[${index}].doses_per_vial`,
                    preAlert.doses_per_vial,
                );
                setFieldValue(
                    `${VAR}[${index}].doses_shipped`,
                    preAlert.doses_shipped,
                );
                const dosesShipped = preAlert.doses_shipped ?? 0;
                const dosesShippedAsNumber =
                    typeof dosesShipped === 'number'
                        ? dosesShipped
                        : parseInt(dosesShipped ?? '0', 10);
                setFieldValue(
                    `${VAR}[${index}].vials_shipped`,
                    Math.ceil(dosesShippedAsNumber / (doses_per_vial ?? 1)),
                );
            }
            // Call setFieldTouched before setFieldValue to avoid validation bug
            setFieldTouched(key, true);
            setFieldValue(key, value);
        },
        [
            doses_per_vial,
            index,
            setFieldTouched,
            setFieldValue,
            values.pre_alerts,
        ],
    );

    const handleSetValues = useCallback(
        newValues => {
            setValues(prevValues => ({
                ...prevValues,
                arrival_reports: prevValues.arrival_reports?.map((report, i) =>
                    i === index
                        ? {
                              ...report,
                              ...newValues,
                          }
                        : report,
                ),
            }));
        },
        [index, setValues],
    );
    const handleDosesShippedUpdate = useCallback(
        (value: number) => {
            if (dosesShippedRef.current) {
                const vialsShipped = doses_per_vial
                    ? Math.ceil(
                          ((value as Optional<number>) ?? 0) / doses_per_vial,
                      )
                    : 0;
                handleSetValues({
                    doses_shipped: value,
                    vials_shipped: vialsShipped,
                });
            }
        },
        [doses_per_vial, handleSetValues],
    );

    const handleDosesReceivedUpdate = useCallback(
        (value: number) => {
            if (dosesReceivedRef.current) {
                const vialsReceived = doses_per_vial
                    ? Math.ceil(
                          ((value as Optional<number>) ?? 0) / doses_per_vial,
                      )
                    : 0;
                handleSetValues({
                    doses_received: value,
                    vials_received: vialsReceived,
                });
            }
        },
        [doses_per_vial, handleSetValues],
    );

    const handleVialsShippededUpdate = useCallback(
        (value: number) => {
            if (vialsShippedRef.current) {
                const dosesShipped = value * (doses_per_vial ?? 0);
                handleSetValues({
                    vials_shipped: value,
                    doses_shipped: dosesShipped,
                });
            }
        },
        [doses_per_vial, handleSetValues],
    );

    const handleVialsReceivedUpdate = useCallback(
        (value: number) => {
            if (vialsReceivedRef.current) {
                const dosesReceived = value * (doses_per_vial ?? 0);
                handleSetValues({
                    vials_received: value,
                    doses_received: dosesReceived,
                });
            }
        },
        [doses_per_vial, handleSetValues],
    );

    const handleDosesPerVialUpdate = useCallback(
        (value: number) => {
            const vialsShipped = Math.ceil(
                parseInt(
                    (arrival_reports?.[index].doses_shipped ?? '0') as string,
                    10,
                ) / value,
            );
            const vialsReceived = Math.ceil(
                parseInt(
                    (arrival_reports?.[index].doses_received ?? '0') as string,
                    10,
                ) / value,
            );

            handleSetValues({
                vials_shipped: vialsShipped,
                doses_per_vial: value,
                vials_received: vialsReceived,
            });
        },
        [index, setFieldValue, arrival_reports],
    );

    const onDosesShippedFocused = () => {
        dosesShippedRef.current = true;
    };
    const onDosesShippedBlur = () => {
        dosesShippedRef.current = false;
    };
    const onDosesReceivedFocused = () => {
        dosesReceivedRef.current = true;
    };
    const onDosesReceivedBlur = () => {
        dosesReceivedRef.current = false;
    };
    const onVialsShippedFocused = () => {
        vialsShippedRef.current = true;
    };
    const onVialsShippedBlur = () => {
        vialsShippedRef.current = false;
    };
    const onVialsReceivedFocused = () => {
        vialsReceivedRef.current = true;
    };
    const onVialsReceivedBlur = () => {
        vialsReceivedRef.current = false;
    };

    return (
        <div className={classes.container}>
            <Paper
                className={classNames(
                    classes.paper,
                    markedForDeletion ? classes.markedForDeletion : '',
                )}
            >
                <Grid container>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={3}>
                            {/* TODO Add errors */}
                            <Box mb={2}>
                                <Field
                                    label={formatMessage(MESSAGES.po_number)}
                                    name={`${VAR}[${index}].po_number`}
                                    component={Select}
                                    shrinkLabel={false}
                                    freeSolo
                                    options={poNumberOptions}
                                    disabled={
                                        markedForDeletion ||
                                        !arrival_reports?.[index].can_edit
                                    }
                                    required
                                    onChange={handleChangePoNumber}
                                />
                            </Box>
                            <Field
                                label={formatMessage(MESSAGES.vials_shipped)}
                                name={`${VAR}[${index}].vials_shipped`}
                                component={NumberInput}
                                disabled={
                                    markedForDeletion ||
                                    !arrival_reports?.[index].can_edit
                                }
                                onFocus={onVialsShippedFocused}
                                onBlur={onVialsShippedBlur}
                                onChange={handleVialsShippededUpdate}
                                required
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.arrival_report_date,
                                )}
                                name={`${VAR}[${index}].arrival_report_date`}
                                component={DateInput}
                                disabled={
                                    markedForDeletion ||
                                    !arrival_reports?.[index].can_edit
                                }
                                required
                            />
                            <Field
                                label={formatMessage(MESSAGES.vials_received)}
                                name={`${VAR}[${index}].vials_received`}
                                component={NumberInput}
                                disabled={
                                    markedForDeletion ||
                                    !arrival_reports?.[index].can_edit
                                }
                                onFocus={onVialsReceivedFocused}
                                onBlur={onVialsReceivedBlur}
                                onChange={handleVialsReceivedUpdate}
                                required
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`${VAR}[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={
                                    markedForDeletion ||
                                    !arrival_reports?.[index].can_edit
                                }
                                onFocus={onDosesShippedFocused}
                                onBlur={onDosesShippedBlur}
                                onChange={handleDosesShippedUpdate}
                                required
                            />
                            <Box mt={2}>
                                <Field
                                    label={formatMessage(
                                        MESSAGES.doses_per_vial,
                                    )}
                                    name={`arrival_reports[${index}].doses_per_vial`}
                                    component={SingleSelect}
                                    disabled={
                                        markedForDeletion ||
                                        !arrival_reports?.[index].can_edit ||
                                        dosesForVaccineOptions.length === 1
                                    }
                                    onChange={handleDosesPerVialUpdate}
                                    options={dosesForVaccineOptions}
                                    clearable={false}
                                    required
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.doses_received)}
                                name={`${VAR}[${index}].doses_received`}
                                component={NumberInput}
                                disabled={
                                    markedForDeletion ||
                                    !arrival_reports?.[index].can_edit
                                }
                                onFocus={onDosesReceivedFocused}
                                onBlur={onDosesReceivedBlur}
                                onChange={handleDosesReceivedUpdate}
                                required
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
            {/* Box is necessay to avoid bad tooltip placemement */}
            {arrival_reports?.[index].can_edit && (
                <Box ml={2}>
                    {!arrival_reports?.[index].to_delete && (
                        <DeleteIconButton
                            onClick={() => {
                                if (values?.arrival_reports?.[index].id) {
                                    setFieldValue(
                                        `${VAR}[${index}].to_delete`,
                                        true,
                                    );
                                    setFieldTouched(
                                        `${VAR}[${index}].to_delete`,
                                        true,
                                    );
                                } else {
                                    const copy = [
                                        ...(values?.arrival_reports ?? []),
                                    ];
                                    // checking the length to avoid splicing outside of array range
                                    if (copy.length >= index + 1) {
                                        copy.splice(index, 1);
                                        setFieldValue(VAR, copy);
                                    }
                                }
                            }}
                            message={MESSAGES.markForDeletion}
                        />
                    )}
                    {arrival_reports?.[index].to_delete && (
                        <IconButton
                            onClick={() => {
                                setFieldValue(
                                    `${VAR}[${index}].to_delete`,
                                    false,
                                );
                            }}
                            overrideIcon={RestoreFromTrashIcon}
                            tooltipMessage={MESSAGES.cancelDeletion}
                        />
                    )}
                </Box>
            )}
        </div>
    );
};
