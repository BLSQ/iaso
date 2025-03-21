import React, { FunctionComponent, useCallback, useMemo, useRef } from 'react';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import { Field, useFormikContext } from 'formik';
import { DeleteIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { NumberCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import DocumentUploadWithPreview from '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/DocumentUploadWithPreview';
import { processErrorDocsBase } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/utils';
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
    const { values, setFieldValue, setFieldTouched, errors } =
        useFormikContext<SupplyChainFormData>();
    const { pre_alerts } = values as SupplyChainFormData;
    const markedForDeletion = pre_alerts?.[index].to_delete ?? false;
    const uneditableTextStyling = markedForDeletion ? grayText : undefined;
    const doses_per_vial_default = vaccine ? dosesPerVial[vaccine] : undefined;
    const doses_per_vial =
        pre_alerts?.[index].doses_per_vial ?? doses_per_vial_default;
    // const [isDosesFocused, setIsDosesFocused] = useState<boolean>(false);
    // const [isVialsFocused, setIsVialsFocused] = useState<boolean>(false);

    // Use refs to track focused state to reduce renders and avoid sluggish UI
    const dosesRef = useRef<boolean>(false);
    const vialsRef = useRef<boolean>(false);

    const documentErrors = useMemo(() => {
        return processErrorDocsBase(errors[index]?.document);
    }, [errors, index]);

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

    const handleVialsShippedUpdate = useCallback(
        (value: number) => {
            if (vialsRef.current) {
                const dosesShipped = value * (doses_per_vial ?? 0);
                setFieldValue(`pre_alerts[${index}].vials_shipped`, value);
                setFieldValue(
                    `pre_alerts[${index}].doses_shipped`,
                    dosesShipped,
                );
            }
        },
        [doses_per_vial, index, setFieldValue],
    );
    const handleDosesShippedUpdate = useCallback(
        (value: number) => {
            if (dosesRef.current) {
                const vialsShipped = doses_per_vial
                    ? Math.ceil((value ?? 0) / doses_per_vial)
                    : 0;
                setFieldValue(`pre_alerts[${index}].doses_shipped`, value);
                setFieldValue(
                    `pre_alerts[${index}].vials_shipped`,
                    vialsShipped,
                );
            }
        },
        [doses_per_vial, index, setFieldValue],
    );
    const onDosesFocus = () => {
        dosesRef.current = true;
    };
    const onDosesBlur = () => {
        dosesRef.current = false;
    };
    const onVialsFocus = () => {
        vialsRef.current = true;
    };
    const onVialsBlur = () => {
        vialsRef.current = false;
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
                        <Grid item xs={6} md={4}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.date_pre_alert_reception,
                                )}
                                name={`pre_alerts[${index}].date_pre_alert_reception`}
                                component={DateInput}
                                disabled={
                                    markedForDeletion ||
                                    !pre_alerts?.[index].can_edit
                                }
                                required
                            />
                            <Field
                                label={formatMessage(MESSAGES.doses_shipped)}
                                name={`pre_alerts[${index}].doses_shipped`}
                                component={NumberInput}
                                disabled={
                                    markedForDeletion ||
                                    !pre_alerts?.[index].can_edit
                                }
                                onChange={handleDosesShippedUpdate}
                                onFocus={onDosesFocus}
                                onBlur={onDosesBlur}
                                required
                            />
                            <Box mt={2}>
                                <DocumentUploadWithPreview
                                    errors={documentErrors}
                                    onFilesSelect={files => {
                                        if (files.length) {
                                            setFieldTouched(
                                                `pre_alerts[${index}].document`,
                                                true,
                                            );
                                            setFieldValue(
                                                `pre_alerts[${index}].document`,
                                                files,
                                            );
                                        }
                                    }}
                                    // @ts-ignore
                                    document={
                                        values?.pre_alerts?.[index]?.document
                                    }
                                    scanResult={
                                        values?.pre_alerts?.[index]?.scan_result
                                    }
                                    scanTimestamp={
                                        values?.pre_alerts?.[index]
                                            ?.scan_timestamp
                                    }
                                    coloredScanResultIcon
                                    disabled={
                                        markedForDeletion ||
                                        !pre_alerts?.[index].can_edit
                                    }
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Box mb={2}>
                                <Field
                                    label={formatMessage(MESSAGES.po_number)}
                                    name={`pre_alerts[${index}].po_number`}
                                    component={TextInput}
                                    disabled={
                                        markedForDeletion ||
                                        !pre_alerts?.[index].can_edit
                                    }
                                    shrinkLabel={false}
                                    required
                                />
                            </Box>
                            <Field
                                label={formatMessage(MESSAGES.vials_shipped)}
                                name={`pre_alerts[${index}].vials_shipped`}
                                component={NumberInput}
                                disabled={
                                    markedForDeletion ||
                                    !pre_alerts?.[index].can_edit
                                }
                                onChange={handleVialsShippedUpdate}
                                onFocus={onVialsFocus}
                                onBlur={onVialsBlur}
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
                                disabled={
                                    markedForDeletion ||
                                    !pre_alerts?.[index].can_edit
                                }
                                required
                            />
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
                    </Grid>
                </Grid>
            </Paper>
            {/* Box is necessay to avoid bad tooltip placement */}
            {pre_alerts?.[index].can_edit && (
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
            )}
        </div>
    );
};
