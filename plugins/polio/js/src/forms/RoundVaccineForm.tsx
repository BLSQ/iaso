import { Grid } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent, useEffect } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Select, TextInput } from '../components/Inputs';
import MESSAGES from '../constants/messages';
import { useStyles } from '../styles/theme';
import { DropdownOptions } from '../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    vaccineIndex: number;
    roundIndex: number;
    vaccineOptions: any[];
};

const dosesOptions: DropdownOptions<5 | 10 | 20 | 50>[] = [
    {
        label: '5',
        value: 5,
    },
    {
        label: '10',
        value: 10,
    },
    {
        label: '20',
        value: 20,
    },
    {
        label: '50',
        value: 50,
    },
];

export const RoundVaccineForm: FunctionComponent<Props> = ({
    roundIndex,
    vaccineIndex,
    vaccineOptions,
}) => {
    const { formatMessage } = useSafeIntl();
    const {
        setFieldValue,
        // @ts-ignore
        values: { rounds },
    } = useFormikContext();
    const classes: Record<string, string> = useStyles();
    const accessor = `rounds[${roundIndex}].vaccines[${vaccineIndex}]`;

    useEffect(() => {
        setFieldValue(`${accessor}.round`, rounds[roundIndex].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <Grid container item xs={12} spacing={2}>
            <Grid item xs={4}>
                <Field
                    label={formatMessage(MESSAGES.vaccine)}
                    name={`${accessor}.name`}
                    className={classes.input}
                    options={vaccineOptions}
                    component={Select}
                />
            </Grid>
            <Grid item xs={4}>
                <Field
                    label={formatMessage(MESSAGES.dosesPerVial)}
                    name={`${accessor}.doses_per_vial`}
                    className={classes.input}
                    options={dosesOptions}
                    component={Select}
                />
            </Grid>
            <Grid item xs={4}>
                <Field
                    label={formatMessage(MESSAGES.wastageRatio)}
                    name={`${accessor}.wastage_ratio_forecast`}
                    component={TextInput} // TODO make NumberInput
                    className={classes.input}
                />
            </Grid>
        </Grid>
    );
};
