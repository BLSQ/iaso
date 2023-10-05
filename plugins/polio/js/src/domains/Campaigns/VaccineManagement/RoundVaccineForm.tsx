import { Box, Grid } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../../../styles/theme';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';
import { DebouncedTextInput } from '../../../components/Inputs/DebouncedTextInput';

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
        // @ts-ignore
        values: { rounds },
    } = useFormikContext();
    const { vaccines = [] } = rounds[roundIndex] ?? {};
    const selectedVaccine = vaccines[vaccineIndex];
    const classes: Record<string, string> = useStyles();
    const accessor = `rounds[${roundIndex}].vaccines[${vaccineIndex}]`;
    const options = useMemo(() => {
        if (!selectedVaccine?.name) return vaccineOptions;
        return [
            ...vaccineOptions,
            { label: selectedVaccine.name, value: selectedVaccine.name },
        ];
    }, [selectedVaccine?.name, vaccineOptions]);

    return (
        <>
            <Grid item xs={4}>
                <Box mr={2}>
                    <Field
                        label={formatMessage(MESSAGES.vaccine)}
                        name={`${accessor}.name`}
                        className={classes.input}
                        options={options}
                        clearable={false}
                        component={SingleSelect}
                    />
                </Box>
            </Grid>
            <Grid item xs={4}>
                <Box mr={2}>
                    <Field
                        label={formatMessage(MESSAGES.dosesPerVial)}
                        name={`${accessor}.doses_per_vial`}
                        className={classes.input}
                        options={dosesOptions}
                        clearable={false}
                        component={SingleSelect}
                    />
                </Box>
            </Grid>
            <Grid item xs={4}>
                <Field
                    label={formatMessage(MESSAGES.wastageRatio)}
                    name={`${accessor}.wastage_ratio_forecast`}
                    component={DebouncedTextInput}
                    debounceTime={300}
                    className={classes.input}
                />
            </Grid>
        </>
    );
};
