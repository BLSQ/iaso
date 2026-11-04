import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { DropdownOptions, useSafeIntl } from 'bluesquare-components';
import { Field } from 'formik';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { SelectInput } from 'Iaso/components/forms/SelectInput';
import { SxStyles } from 'Iaso/types/general';
import { CARDINALITY_INPUT_OPTIONS, INFINITY_SYMBOL } from '../../utils';
import {
    CREATED_TYPE_CONFIG,
    CreatedTypeMissionType,
} from '../missionTypeOptions';
import { missionStyles } from '../styles';
import { MissionStepHeader } from './MissionStepHeader';

const styles: SxStyles = {
    step: {
        ...missionStyles.bordered,
        p: 2,
        mb: 3,
    },
};

type Props = {
    missionType: CreatedTypeMissionType;
    step: number;
    typeOptions?: DropdownOptions<number>[];
    isLoadingTypeOptions: boolean;
    onTypeChange: (keyValue: string, value: number) => void;
};

export const MissionCreatedTypeStep: FunctionComponent<Props> = ({
    missionType,
    step,
    typeOptions,
    isLoadingTypeOptions,
    onTypeChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { fieldName, title, description, typeLabel, minLabel, maxLabel } =
        CREATED_TYPE_CONFIG[missionType];
    return (
        <Box sx={styles.step}>
            <MissionStepHeader
                step={step}
                title={formatMessage(title)}
                description={formatMessage(description)}
            />
            <Field
                name={fieldName}
                label={formatMessage(typeLabel)}
                required
                clearable
                component={SelectInput}
                options={typeOptions}
                loading={isLoadingTypeOptions}
                onChange={onTypeChange}
            />
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Field
                        label={formatMessage(minLabel)}
                        name="min_cardinality"
                        initialValue={1}
                        min={1}
                        component={NumberInput}
                        numberInputOptions={CARDINALITY_INPUT_OPTIONS}
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Field
                        label={formatMessage(maxLabel)}
                        name="max_cardinality"
                        initialValue={1}
                        min={0}
                        placeholder={INFINITY_SYMBOL}
                        component={NumberInput}
                        numberInputOptions={CARDINALITY_INPUT_OPTIONS}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
