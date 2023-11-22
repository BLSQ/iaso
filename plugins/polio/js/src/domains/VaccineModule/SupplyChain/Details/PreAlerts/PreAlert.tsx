/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback } from 'react';
import { Box, Grid, Paper } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import { DeleteIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { NumberInput, TextInput } from '../../../../../components/Inputs';
import MESSAGES from '../../messages';
import { SupplyChainFormData } from '../../types';
import { usePaperStyles } from '../shared';

type Props = {
    index: number;
};

export const PreAlert: FunctionComponent<Props> = ({ index }) => {
    const classes: Record<string, string> = usePaperStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setFieldTouched } =
        useFormikContext<SupplyChainFormData>();
    const { pre_alerts } = values as SupplyChainFormData;
    const markedForDeletion = pre_alerts?.[index].to_delete ?? false;

    const onDelete = useCallback(() => {
        if (values?.pre_alerts?.[index].id) {
            setFieldValue(`pre_alerts[${index}].to_delete`, true);
            setFieldTouched(`pre_alerts[${index}].to_delete`, true);
        } else {
            const copy = [...(values?.pre_alerts ?? [])];
            // checking the length to avoid splicing outside of array range
            if (copy.length >= index + 1) {
                copy.splice(index, 1);
                setFieldValue('pre_alerts', copy);
            }
        }
    }, [index, setFieldTouched, setFieldValue, values?.pre_alerts]);

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
                            label={formatMessage(
                                MESSAGES.date_pre_alert_reception,
                            )}
                            name={`pre_alerts[${index}].date_pre_alert_reception`}
                            component={DateInput}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(MESSAGES.po_number)}
                            name={`pre_alerts[${index}].po_number`}
                            component={TextInput}
                            shrinkLabel={false}
                            touchOnFocus={false}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                    {/* TODO make list */}
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(MESSAGES.lot_numbers)}
                            name={`pre_alerts[${index}].lot_numbers`}
                            component={TextInput}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(
                                MESSAGES.estimated_arrival_time,
                            )}
                            name={`pre_alerts[${index}].estimated_arrival_time`}
                            component={DateInput}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.expirationDate)}
                                name={`pre_alerts[${index}].expiration_date`}
                                component={DateInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`pre_alerts[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>

                    {/* <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.doses_received)}
                                name={`pre_alerts[${index}].doses_received`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid> */}
                </Grid>
            </Paper>
            {/* Box is necessay to avoid bad tooltip placement */}
            <Box ml={2}>
                {!pre_alerts?.[index].to_delete && (
                    <DeleteIconButton
                        onClick={onDelete}
                        message={MESSAGES.markForDeletion}
                    />
                )}
                {pre_alerts?.[index].to_delete && (
                    <IconButton
                        onClick={() => {
                            setFieldValue(
                                `pre_alerts[${index}].to_delete`,
                                false,
                            );
                        }}
                        overrideIcon={RestoreFromTrashIcon}
                        tooltipMessage={MESSAGES.cancelDeletion}
                    />
                )}
            </Box>
        </div>
    );
};
