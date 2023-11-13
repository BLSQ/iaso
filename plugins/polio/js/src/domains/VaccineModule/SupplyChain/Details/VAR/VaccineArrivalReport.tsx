import React, { FunctionComponent } from 'react';
import {
    Box,
    Grid,
    Paper,
    Theme,
    Typography,
    makeStyles,
} from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import classNames from 'classnames';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import { DeleteIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { DateInput } from '../../../../../components/Inputs/DateInput';
import { NumberInput, TextInput } from '../../../../../components/Inputs';
import { SupplyChainFormData } from '../VaccineSupplyChainDetails';
import MESSAGES from '../../messages';

const useStyles = makeStyles((theme: Theme) => ({
    paper: {
        padding: theme.spacing(4, 2, 2, 4),
        marginBottom: theme.spacing(4),
        // @ts-ignore
        border: `1px solid ${theme.palette.mediumGray.main}`,
        width: 'calc(100% - 64px)',
    },
    markedForDeletion: {
        backgroundColor: theme.palette.grey['200'],
    },
}));

type Props = { index: number };

export const VaccineArrivalReport: FunctionComponent<Props> = ({ index }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, setFieldValue, setFieldTouched } =
        useFormikContext<SupplyChainFormData>();
    const { vars } = values as SupplyChainFormData;
    const markedForDeletion = vars?.[index].to_delete ?? false;
    return (
        <div style={{ display: 'inline-flex', width: '100%' }}>
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
                            name={`vars[${index}].arrival_report_date`}
                            component={DateInput}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(MESSAGES.po_number)}
                            name={`vars[${index}].po_number`}
                            component={TextInput}
                            shrinkLabel={false}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Field
                            label={formatMessage(MESSAGES.lot_number)}
                            name={`vars[${index}].lot_number`}
                            component={NumberInput}
                            disabled={markedForDeletion}
                        />
                    </Grid>
                </Grid>
                <Grid container item xs={12} spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.expirationDate)}
                                name={`vars[${index}].expiration_date`}
                                component={DateInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`vars[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Box>
                            <Field
                                label={formatMessage(MESSAGES.doses_received)}
                                name={`vars[${index}].doses_received`}
                                component={NumberInput}
                                disabled={markedForDeletion}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <Box mt={2}>
                            <Typography variant="button">
                                {' '}
                                {`${formatMessage(
                                    MESSAGES.dosesPerVial,
                                )}: SOME NUMBER`}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
            {/* Box is necessay to avoid bad tooltip placemement */}
            <Box ml={2}>
                {!vars?.[index].to_delete && (
                    <DeleteIconButton
                        onClick={() => {
                            if (values?.vars?.[index].id) {
                                setFieldValue(`vars[${index}].to_delete`, true);
                                setFieldTouched(
                                    `vars[${index}].to_delete`,
                                    true,
                                );
                            } else {
                                const copy = [...(values?.vars ?? [])];
                                // checking the length to avoid splicing outside of array range
                                if (copy.length >= index + 1) {
                                    copy.splice(index, 1);
                                    setFieldValue('vars', copy);
                                }
                            }
                        }}
                        message={MESSAGES.markForDeletion}
                    />
                )}
                {vars?.[index].to_delete && (
                    <IconButton
                        onClick={() => {
                            setFieldValue(`vars[${index}].to_delete`, false);
                        }}
                        overrideIcon={RestoreFromTrashIcon}
                        tooltipMessage={MESSAGES.cancelDeletion}
                    />
                )}
            </Box>
        </div>
    );
};
