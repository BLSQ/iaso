import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { DropdownOptions, useSafeIntl } from 'bluesquare-components';
import { Field } from 'formik';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { SelectInput } from 'Iaso/components/forms/SelectInput';
import { SxStyles } from 'Iaso/types/general';
import {
    CREATED_TYPE_SECTION_MESSAGES,
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

const numberInputOptions = { showArrows: true, showInfo: false } as const;

const TYPE_FIELD_NAMES = {
    [MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM]: 'org_unit_type',
    [MissionTypeDa2Enum.enum.ENTITY_AND_FORM]: 'entity_type',
};

type Props = {
    missionType: CreatedTypeMissionType;
    typeOptions?: DropdownOptions<number>[];
    isLoadingTypeOptions: boolean;
    onTypeChange: (keyValue: string, value: number) => void;
};

export const MissionCreatedTypeStep: FunctionComponent<Props> = ({
    missionType,
    typeOptions,
    isLoadingTypeOptions,
    onTypeChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { title, description, typeLabel, minLabel, maxLabel } =
        CREATED_TYPE_SECTION_MESSAGES[missionType];
    return (
        <Box sx={styles.step}>
            <MissionStepHeader
                step={1}
                title={formatMessage(title)}
                description={formatMessage(description)}
            />
            <Field
                name={TYPE_FIELD_NAMES[missionType]}
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
                        label={formatMessage(maxLabel)}
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
};
