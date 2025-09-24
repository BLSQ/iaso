import React, { FunctionComponent, useCallback } from 'react';
import { Grid } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OriginalOrgUnitType } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { DropdownOptionsWithOriginal } from 'Iaso/types/utils';
import { Planning } from '../../assignments/types/planning';
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
    orgUnitTypes: DropdownOptionsWithOriginal<string, OriginalOrgUnitType>[];
    isFetchingOrgUnitTypes: boolean;
    index: number;
    levels: number[] | undefined[];
    handleOrgUnitTypeChange: (value: any, index: number) => void;
    handleOrgUnitTypeQuantityChange: (value: any, index: number) => void;
    handleRemoveLevel: (index: number) => void;
    orgUnitTypeId: number;
    handleParameterChange: (parameterName: string, value: any) => void;
    planning: Planning;
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
    orgUnitTypeId,
    handleParameterChange,
    planning,
}) => {
    const { formatMessage } = useSafeIntl();
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
                    value={orgUnitTypeId}
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
                    labelString={formatMessage(MESSAGES.quantity)}
                    value={parameterValues?.org_unit_type_quantities?.[index]}
                />
            </Grid>
            {index !== 0 && (
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
            )}
            <Grid
                item
                xs={index !== 0 ? 1 : 2}
                display="flex"
                justifyContent="center"
                alignItems="center"
                mt={1}
            >
                <PopperConfig
                    index={index}
                    selectedOrgUnitIds={
                        parameterValues?.org_unit_type_exceptions?.[index] || []
                    }
                    orgUnitTypeId={orgUnitTypeId}
                    handleParameterChange={handleParameterChange}
                    parameterValues={parameterValues}
                    planning={planning}
                />
            </Grid>
        </Grid>
    );
};
