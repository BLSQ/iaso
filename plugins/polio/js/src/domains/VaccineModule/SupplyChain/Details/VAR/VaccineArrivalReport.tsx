/* eslint-disable camelcase */
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { DeleteIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { NumberCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import { Optional } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { NumberInput, Select } from '../../../../../components/Inputs';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { VAR } from '../../constants';
import { dosesPerVial } from '../../hooks/utils';
import MESSAGES from '../../messages';
import { SupplyChainFormData } from '../../types';
import { grayText, usePaperStyles } from '../shared';

type Props = { index: number; vaccine?: string };

export const VaccineArrivalReport: FunctionComponent<Props> = ({
    index,
    vaccine,
}) => {
    const classes: Record<string, string> = usePaperStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setFieldTouched } =
        useFormikContext<SupplyChainFormData>();
    const { arrival_reports } = values as SupplyChainFormData;
    const markedForDeletion = arrival_reports?.[index].to_delete ?? false;
    const uneditableTextStyling = markedForDeletion ? grayText : undefined;

    const doses_per_vial_default = vaccine ? dosesPerVial[vaccine] : undefined;
    const doses_per_vial =
        arrival_reports?.[index].doses_per_vial ?? doses_per_vial_default;
    const current_vials_shipped = doses_per_vial
        ? Math.ceil(
              ((arrival_reports?.[index].doses_shipped as Optional<number>) ??
                  0) / doses_per_vial,
          )
        : 0;
    const current_vials_received = doses_per_vial
        ? Math.ceil(
              ((arrival_reports?.[index].doses_received as Optional<number>) ??
                  0) / doses_per_vial,
          )
        : 0;

    const poNumberOptions = useMemo(() => {
        return (
            values.pre_alerts
                ?.filter(
                    preAlert => preAlert.po_number && preAlert.doses_shipped,
                )
                .map(preAlert => ({
                    label: preAlert.po_number,
                    value: preAlert.po_number,
                })) || []
        );
    }, [values.pre_alerts]);
    const handleChangePoNumber = useCallback(
        (key, value) => {
            const preAlert = values.pre_alerts?.find(
                pre => pre.po_number === value,
            );
            if (preAlert) {
                setFieldValue(
                    `${VAR}[${index}].doses_shipped`,
                    preAlert.doses_shipped,
                );
            }
            setFieldValue(key, value);
        },
        [index, setFieldValue, values.pre_alerts],
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
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.po_number)}
                                name={`${VAR}[${index}].po_number`}
                                component={Select}
                                shrinkLabel={false}
                                freeSolo
                                options={poNumberOptions}
                                disabled={markedForDeletion}
                                required
                                onChange={handleChangePoNumber}
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.arrival_report_date,
                                )}
                                name={`${VAR}[${index}].arrival_report_date`}
                                component={DateInput}
                                disabled={markedForDeletion}
                                required
                            />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`${VAR}[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                                required
                            />
                        </Grid>

                        <Grid item xs={6} md={3}>
                            <Field
                                label={formatMessage(MESSAGES.doses_received)}
                                name={`${VAR}[${index}].doses_received`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                                required
                            />
                        </Grid>
                    </Grid>
                    <Grid container item xs={12} spacing={2}>
                        <Grid item xs={6} md={3}>
                            <Typography
                                variant="button"
                                sx={uneditableTextStyling}
                            >
                                {`${formatMessage(MESSAGES.doses_per_vial)}:`}{' '}
                                <NumberCell value={doses_per_vial} />
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography
                                variant="button"
                                sx={uneditableTextStyling}
                            >
                                {`${formatMessage(MESSAGES.vials_shipped)}:`}{' '}
                                <NumberCell value={current_vials_shipped} />
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography
                                variant="button"
                                sx={uneditableTextStyling}
                            >
                                {`${formatMessage(MESSAGES.vials_received)}:`}{' '}
                                <NumberCell value={current_vials_received} />
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
