/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { Field, useFormikContext } from 'formik';
import classNames from 'classnames';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { DeleteIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { NumberInput, TextInput } from '../../../../../components/Inputs';
import MESSAGES from '../../messages';
import { SupplyChainFormData } from '../../types';
import { VAR } from '../../constants';
import { usePaperStyles } from '../shared';

type Props = { index: number };



export const VaccineArrivalReport: FunctionComponent<Props> = ({ index }) => {
    const classes: Record<string, string> = usePaperStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setFieldTouched } =
        useFormikContext<SupplyChainFormData>();
    const { arrival_reports } = values as SupplyChainFormData;
    const markedForDeletion = arrival_reports?.[index].to_delete ?? false;

    const doses_per_vial = arrival_reports?.[index].doses_per_vial ?? 20;
    const initial_vials_shipped = (arrival_reports?.[index].doses_shipped ?? 0) / doses_per_vial;
    const initial_vials_received = (arrival_reports?.[index].doses_received ?? 0) / doses_per_vial;

    const [vialsShipped, setVialsShipped] = useState(initial_vials_shipped);
    const [vialsReceived, setVialsReceived] = useState(initial_vials_received);

    const updateVialsShipped = useCallback(
        (newDosesShipped: any) => {
            const newVialsShipped = Math.ceil(Number(newDosesShipped) / doses_per_vial);
            setVialsShipped(newVialsShipped);
        },
        [setFieldValue, values, doses_per_vial],
    );

    const updateVialsReceived = useCallback(
        (newDosesReceived: any) => {
            const newVialsReceived = Math.ceil(Number(newDosesReceived) / doses_per_vial);
            setVialsReceived(newVialsReceived);
        },
        [setFieldValue, values, doses_per_vial],
    );

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
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.arrival_report_date,
                                )}
                                name={`${VAR}[${index}].arrival_report_date`}
                                component={DateInput}
                                disabled={markedForDeletion}
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(MESSAGES.po_number)}
                                name={`${VAR}[${index}].po_number`}
                                component={TextInput}
                                shrinkLabel={false}
                                disabled={markedForDeletion}
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(MESSAGES.lot_numbers)}
                                name={`${VAR}[${index}].lot_numbers`}
                                component={TextInput}
                                disabled={markedForDeletion}
                                shrinkLabel={false}
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(MESSAGES.expirationDate)}
                                name={`${VAR}[${index}].expiration_date`}
                                component={DateInput}
                                disabled={markedForDeletion}
                            />
                        </Grid>

                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`${VAR}[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                                externalOnChange={updateVialsShipped}
                            />
                        </Grid>

                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(MESSAGES.doses_received)}
                                name={`${VAR}[${index}].doses_received`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                                externalOnChange={updateVialsReceived}
                            />
                        </Grid>
                    </Grid>

                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={4}>
                            <Typography variant="button">
                                {`${formatMessage(MESSAGES.doses_per_vial)}: ${doses_per_vial}`}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography variant="button">
                                {`${formatMessage(MESSAGES.vials_shipped)}: ${vialsShipped}`}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography variant="button">
                                {`${formatMessage(MESSAGES.vials_received)}: ${vialsReceived}`}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
            {/* Box is necessay to avoid bad tooltip placemement */}
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
                            setFieldValue(`${VAR}[${index}].to_delete`, false);
                        }}
                        overrideIcon={RestoreFromTrashIcon}
                        tooltipMessage={MESSAGES.cancelDeletion}
                    />
                )}
            </Box>
        </div>
    );
};
