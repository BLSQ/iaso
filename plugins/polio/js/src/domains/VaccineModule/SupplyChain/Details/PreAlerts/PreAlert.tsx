/* eslint-disable camelcase */
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent, useCallback } from 'react';
import { DeleteIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { NumberCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import { Optional } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { NumberInput, TextInput } from '../../../../../components/Inputs';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { dosesPerVial } from '../../hooks/utils';
import MESSAGES from '../../messages';
import { SupplyChainFormData } from '../../types';
import { grayText, usePaperStyles } from '../shared';

type Props = {
    index: number;
    vaccine?: string;
};

export const PreAlert: FunctionComponent<Props> = ({ index, vaccine }) => {
    const classes: Record<string, string> = usePaperStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setFieldTouched } =
        useFormikContext<SupplyChainFormData>();
    const { pre_alerts } = values as SupplyChainFormData;
    const markedForDeletion = pre_alerts?.[index].to_delete ?? false;
    const uneditableTextStyling = markedForDeletion ? grayText : undefined;
    const doses_per_vial_default = vaccine ? dosesPerVial[vaccine] : undefined;
    const doses_per_vial =
        pre_alerts?.[index].doses_per_vial ?? doses_per_vial_default;
    const current_vials_shipped = doses_per_vial
        ? Math.ceil(
              ((pre_alerts?.[index].doses_shipped as Optional<number>) ?? 0) /
                  doses_per_vial,
          )
        : 0;

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
                <Grid container>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.date_pre_alert_reception,
                                )}
                                name={`pre_alerts[${index}].date_pre_alert_reception`}
                                component={DateInput}
                                disabled={markedForDeletion}
                                required
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(MESSAGES.po_number)}
                                name={`pre_alerts[${index}].po_number`}
                                component={TextInput}
                                disabled={markedForDeletion}
                                shrinkLabel={false}
                                required
                            />
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.estimated_arrival_time,
                                )}
                                name={`pre_alerts[${index}].estimated_arrival_time`}
                                component={DateInput}
                                disabled={markedForDeletion}
                                required
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`pre_alerts[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                                required
                            />
                        </Grid>
                        <Grid
                            container
                            item
                            xs={6}
                            md={4}
                            alignContent="center"
                        >
                            <Box>
                                <Typography
                                    variant="button"
                                    sx={uneditableTextStyling}
                                >
                                    {`${formatMessage(
                                        MESSAGES.doses_per_vial,
                                    )}:`}{' '}
                                    <NumberCell value={doses_per_vial} />
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid
                            container
                            item
                            xs={6}
                            md={4}
                            alignContent="center"
                        >
                            <Box>
                                <Typography
                                    variant="button"
                                    sx={uneditableTextStyling}
                                >
                                    {`${formatMessage(
                                        MESSAGES.vials_shipped,
                                    )}:`}{' '}
                                    <NumberCell value={current_vials_shipped} />
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
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
