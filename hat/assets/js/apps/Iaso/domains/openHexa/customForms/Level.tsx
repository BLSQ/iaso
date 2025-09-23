import React, { FunctionComponent, useCallback } from 'react';
import { Grid } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { DropdownOptions } from 'Iaso/types/utils';
import { MESSAGES } from '../messages';
import { PopperConfig } from './PopperConfig';
type ParameterValues =
    | {
          org_unit_type_quantities?: number[];
          org_unit_type_sequence_identifiers?: number[];
          org_unit_type_exceptions?: number[][];
      }
    | undefined;
type Props = {
    parameterValues?: ParameterValues;
    orgUnitTypes: DropdownOptions<string>[] | undefined;
    isFetchingOrgUnitTypes: boolean;
    index: number;
    levels: number[] | undefined[];
    handleOrgUnitTypeChange: (value: any, index: number) => void;
    handleOrgUnitTypeQuantityChange: (value: any, index: number) => void;
    handleRemoveLevel: (index: number) => void;
    orgUnitType: number;
};

export const Level: FunctionComponent<Props> = ({
    parameterValues,
    orgUnitTypes,
    isFetchingOrgUnitTypes,
    index,
    levels,
    handleOrgUnitTypeChange,
    handleOrgUnitTypeQuantityChange,
    handleRemoveLevel,
    orgUnitType,
}) => {
    const { formatMessage } = useSafeIntl();

    // Helper to get options for a specific level
    const getOptionsForLevel = useCallback(
        (index: number) => {
            if (index === 0) return orgUnitTypes;

            const previousLevel = orgUnitTypes?.find(
                orgUnitType => orgUnitType.value === `${levels[index - 1]}`,
            );

            return previousLevel
                ? orgUnitTypes?.filter(orgUnitType =>
                      previousLevel.original?.sub_unit_types.includes(
                          orgUnitType.original?.id,
                      ),
                  )
                : orgUnitTypes;
        },
        [orgUnitTypes, levels],
    );
    const isLastLevel = index === levels.length - 1;
    const canRemove = isLastLevel && index > 0;

    return (
        <Grid container spacing={1} key={`level_${index}`}>
            <Grid item xs={8}>
                <InputComponent
                    type="select"
                    keyValue={`org_unit_type_sequence_identifiers_${index}`}
                    onChange={(_, value) =>
                        handleOrgUnitTypeChange(value, index)
                    }
                    clearable={false}
                    labelString={`${formatMessage(MESSAGES.level)} ${index + 1}`}
                    value={orgUnitType}
                    options={getOptionsForLevel(index)}
                    loading={isFetchingOrgUnitTypes}
                    disabled={!isLastLevel}
                />
            </Grid>
            <Grid item xs={2}>
                <InputComponent
                    type="number"
                    keyValue={`org_unit_type_quantities_${index}`}
                    onChange={(_, value) =>
                        handleOrgUnitTypeQuantityChange(value, index)
                    }
                    disabled={!isLastLevel}
                    labelString={formatMessage(MESSAGES.quantity)}
                    value={parameterValues?.org_unit_type_quantities?.[index]}
                />
            </Grid>
            <Grid
                item
                xs={1}
                display="flex"
                justifyContent="center"
                alignItems="center"
                mt={1}
            >
                <IconButton
                    icon="delete"
                    disabled={!canRemove}
                    onClick={() => handleRemoveLevel(index)}
                    tooltipMessage={MESSAGES.removeLevel}
                />
            </Grid>
            <Grid
                item
                xs={1}
                display="flex"
                justifyContent="center"
                alignItems="center"
                mt={1}
            >
                <PopperConfig index={index} />
            </Grid>
        </Grid>
    );
};
