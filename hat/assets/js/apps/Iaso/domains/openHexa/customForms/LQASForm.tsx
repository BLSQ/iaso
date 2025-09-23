import React, { FunctionComponent, useCallback, useMemo } from 'react';
import PlusIcon from '@mui/icons-material/Add';
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { Planning } from '../../assignments/types/planning';
import { MESSAGES } from '../messages';
import { Level } from './Level';
type ParameterValues =
    | {
          org_unit_type_quantities?: number[];
          org_unit_type_sequence_identifiers?: number[];
          org_unit_type_exceptions?: number[][];
      }
    | undefined;
type Props = {
    parameterValues?: ParameterValues;
    handleParameterChange: (parameterName: string, value: any) => void;
    planning: Planning;
};

export const LQASForm: FunctionComponent<Props> = ({
    parameterValues,
    handleParameterChange,
    planning,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: orgUnitTypes, isFetching: isFetchingOrgUnitTypes } =
        useGetOrgUnitTypesDropdownOptions({
            projectId: planning.project,
        });

    // Generic array update helper
    const updateArrayAtIndex = useCallback(
        (arrayName: string, index: number, value: any) => {
            const currentArray = parameterValues?.[arrayName] || [];
            const updatedArray = [...currentArray];
            updatedArray[index] = parseInt(value, 10);
            handleParameterChange(arrayName, updatedArray);
        },
        [parameterValues, handleParameterChange],
    );

    // Generic array manipulation helpers
    const addToArray = useCallback(
        (arrayName: string, value: any = undefined) => {
            const currentArray = parameterValues?.[arrayName] || [];
            handleParameterChange(arrayName, [...currentArray, value]);
        },
        [parameterValues, handleParameterChange],
    );

    const removeFromArray = useCallback(
        (arrayName: string, index: number) => {
            const currentArray = parameterValues?.[arrayName] || [];
            const updatedArray = [...currentArray];
            updatedArray.splice(index, 1);
            handleParameterChange(arrayName, updatedArray);
        },
        [parameterValues, handleParameterChange],
    );

    // Specific handlers using generic helpers
    const handleOrgUnitTypeChange = useCallback(
        (value: any, index: number) => {
            updateArrayAtIndex(
                'org_unit_type_sequence_identifiers',
                index,
                value,
            );
        },
        [updateArrayAtIndex],
    );

    const handleOrgUnitTypeQuantityChange = useCallback(
        (value: any, index: number) => {
            updateArrayAtIndex('org_unit_type_quantities', index, value);
        },
        [updateArrayAtIndex],
    );

    const handleAddLevel = useCallback(() => {
        addToArray('org_unit_type_sequence_identifiers');
    }, [addToArray]);

    const handleRemoveLevel = useCallback(
        (index: number) => {
            removeFromArray('org_unit_type_sequence_identifiers', index);
            removeFromArray('org_unit_type_quantities', index);
        },
        [removeFromArray],
    );

    // Memoized values
    const levels = useMemo(() => {
        const identifiers = parameterValues?.org_unit_type_sequence_identifiers;
        return identifiers?.length && identifiers.length > 0
            ? identifiers
            : [undefined];
    }, [parameterValues?.org_unit_type_sequence_identifiers]);

    const latestOptions = useMemo(() => {
        const lastLevel = levels[levels.length - 1];
        return lastLevel
            ? orgUnitTypes?.find(
                  orgUnitType => orgUnitType.value === `${lastLevel}`,
              )
            : undefined;
    }, [orgUnitTypes, levels]);

    const canAddLevel = latestOptions?.original?.sub_unit_types.length !== 0;
    const isLastLevelUndefined = levels[levels.length - 1] === undefined;

    return (
        <Box>
            {levels.map((orgUnitType, index) => {
                return (
                    <Level
                        orgUnitTypes={orgUnitTypes}
                        isFetchingOrgUnitTypes={isFetchingOrgUnitTypes}
                        key={`level_${index}`}
                        index={index}
                        levels={levels}
                        handleOrgUnitTypeChange={handleOrgUnitTypeChange}
                        handleOrgUnitTypeQuantityChange={
                            handleOrgUnitTypeQuantityChange
                        }
                        handleRemoveLevel={handleRemoveLevel}
                        orgUnitType={orgUnitType}
                    />
                );
            })}
            {canAddLevel && (
                <Button
                    onClick={handleAddLevel}
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    disabled={isLastLevelUndefined}
                >
                    <PlusIcon sx={{ mr: 1 }} />
                    {formatMessage(MESSAGES.addLevel)}
                </Button>
            )}
        </Box>
    );
};
