import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { DropdownOptions } from 'bluesquare-components';
import { Field } from 'formik';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { SelectInput } from 'Iaso/components/forms/SelectInput';
import { SxStyles } from 'Iaso/types/general';
import { MissionStepHeader } from './MissionStepHeader';

const styles: SxStyles = {
    step: {
        border: theme => `1px solid ${theme.palette.lightGray.border}`,
        borderRadius: 1,
        p: 2,
        mb: 3,
    },
};

const numberInputOptions = { showArrows: true, showInfo: false } as const;

type Props = {
    title: string;
    description: string;
    typeFieldName: 'org_unit_type' | 'entity_type';
    typeLabel: string;
    typeOptions?: DropdownOptions<number>[];
    isLoadingTypeOptions: boolean;
    onTypeChange: (keyValue: string, value: number) => void;
    minLabel: string;
    maxLabel: string;
};

export const MissionCreatedTypeStep: FunctionComponent<Props> = ({
    title,
    description,
    typeFieldName,
    typeLabel,
    typeOptions,
    isLoadingTypeOptions,
    onTypeChange,
    minLabel,
    maxLabel,
}) => (
    <Box sx={styles.step}>
        <MissionStepHeader step={1} title={title} description={description} />
        <Field
            name={typeFieldName}
            label={typeLabel}
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
                    label={minLabel}
                    name={`min_cardinality`}
                    initialValue={1}
                    min={1}
                    component={NumberInput}
                    numberInputOptions={numberInputOptions}
                    required
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <Field
                    label={maxLabel}
                    name={`max_cardinality`}
                    initialValue={1}
                    type={'number'}
                    min={0}
                    placeholder="∞"
                    component={NumberInput}
                    numberInputOptions={numberInputOptions}
                />
            </Grid>
        </Grid>
    </Box>
);
