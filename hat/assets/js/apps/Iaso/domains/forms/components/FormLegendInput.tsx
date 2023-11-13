/* eslint-disable camelcase */

import React, { FunctionComponent } from 'react';
import { Box, makeStyles, Grid } from '@material-ui/core';
import { isEmpty } from 'lodash';

import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import {
    AddLegendDialog,
    EditLegendDialog,
} from '../../../components/LegendBuilder/Dialog';
import { Legend } from '../../../components/LegendBuilder/Legend';
import { FormDataType } from '../types/forms';

type FormFormProps = {
    currentForm: FormDataType;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (key: string, value: any) => void;
    isFormLoading: boolean;
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
    isFormLoading,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {!isFormLoading && (
                <>
                    {!isEmpty(currentForm.legend_threshold.value) && (
                        <Box position="relative" className={classes.fakeField}>
                            <Grid container spacing={1}>
                                <Grid item xs={8}>
                                    <span className={classes.label}>
                                        {formatMessage(MESSAGES.legend)}
                                    </span>
                                    <Legend
                                        threshold={
                                            currentForm.legend_threshold.value
                                        }
                                    />
                                </Grid>
                                <Grid
                                    item
                                    xs={4}
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
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                    {isEmpty(currentForm.legend_threshold.value) && (
                        <AddLegendDialog
                            iconProps={{}}
                            titleMessage={MESSAGES.edit}
                            onConfirm={newThreshold =>
                                setFieldValue('legend_threshold', newThreshold)
                            }
                        />
                    )}
                </>
            )}
        </>
    );
};
