/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Box, Grid, Paper } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import classNames from 'classnames';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
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
    return (
        <div className={classes.container}>
            <Paper
                className={classNames(
                    classes.paper,
                    markedForDeletion ? classes.markedForDeletion : '',
                )}
            >
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(MESSAGES.arrival_report_date)}
                            name={`${VAR}[${index}].arrival_report_date`}
                            component={DateInput}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(MESSAGES.po_number)}
                            name={`${VAR}[${index}].po_number`}
                            component={TextInput}
                            shrinkLabel={false}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(MESSAGES.lot_numbers)}
                            name={`${VAR}[${index}].lot_numbers`}
                            component={TextInput}
                            disabled={markedForDeletion}
                            shrinkLabel={false}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.doses_per_vial)}
                                name={`${VAR}[${index}].doses_per_vial`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.expirationDate)}
                                name={`${VAR}[${index}].expiration_date`}
                                component={DateInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`${VAR}[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.doses_received)}
                                name={`${VAR}[${index}].doses_received`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
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
