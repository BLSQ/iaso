import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Grid, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { isEmpty } from 'lodash';
import React, { FunctionComponent } from 'react';

import { useSafeIntl } from 'bluesquare-components';
import { Legend } from '../../../components/LegendBuilder/Legend';
import {
    AddLegendDialog,
    EditLegendDialog,
} from '../../../components/LegendBuilder/LegendBuilderDialog';
import MESSAGES from '../messages';
import { FormDataType } from '../types/forms';

type FormFormProps = {
    currentForm: FormDataType;
    setFieldValue: (key: string, value: any) => void;
};
const useStyles = makeStyles(theme => ({
    fakeField: {
        padding: theme.spacing(2),
        // @ts-ignore
        border: `1px solid ${theme.palette.border.main}`,
        borderRadius: 4,
    },
    label: {
        color: 'rgba(0, 0, 0, 0.4)', // taken from inputlabel
        display: 'block',
        marginBottom: theme.spacing(2),
    },
}));

export const FormLegendInput: FunctionComponent<FormFormProps> = ({
    currentForm,
    setFieldValue,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {currentForm.legend_threshold?.value !== undefined && (
                <>
                    {!isEmpty(currentForm.legend_threshold?.value) && (
                        <Box position="relative" className={classes.fakeField}>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <span className={classes.label}>
                                        {formatMessage(MESSAGES.legend)}
                                    </span>
                                </Grid>
                                <Grid
                                    item
                                    xs={6}
                                    container
                                    justifyContent="flex-end"
                                    alignContent="flex-start"
                                >
                                    <EditLegendDialog
                                        iconProps={{}}
                                        titleMessage={MESSAGES.edit}
                                        threshold={
                                            currentForm.legend_threshold.value
                                        }
                                        onConfirm={newThreshold =>
                                            setFieldValue(
                                                'legend_threshold',
                                                newThreshold,
                                            )
                                        }
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            setFieldValue(
                                                'legend_threshold',
                                                null,
                                            )
                                        }
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                                <Grid item xs={12}>
                                    <Legend
                                        threshold={
                                            currentForm.legend_threshold.value
                                        }
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                    {isEmpty(currentForm.legend_threshold.value) && (
                        <Box
                            display="flex"
                            justifyContent="flex-end"
                            alignContent="flex-start"
                        >
                            <AddLegendDialog
                                iconProps={{}}
                                titleMessage={MESSAGES.createLegend}
                                onConfirm={newThreshold =>
                                    setFieldValue(
                                        'legend_threshold',
                                        newThreshold,
                                    )
                                }
                            />
                        </Box>
                    )}
                </>
            )}
        </>
    );
};
