import React, { FunctionComponent, useCallback, useMemo } from 'react';
import PlusIcon from '@mui/icons-material/Add';
import { Box, Button, Grid } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { Planning } from '../../assignments/types/planning';
import { ParameterValues } from '../hooks/usePipelineParameters';
import { MESSAGES } from '../messages';

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
        return identifiers?.length > 0 ? identifiers : [undefined];
    }, [parameterValues?.org_unit_type_sequence_identifiers]);

    const latestOptions = useMemo(() => {
        const lastLevel = levels[levels.length - 1];
        return lastLevel
            ? orgUnitTypes?.find(
                  orgUnitType => orgUnitType.value === `${lastLevel}`,
              )
            : undefined;
    }, [orgUnitTypes, levels]);
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

    const canAddLevel = latestOptions?.original?.sub_unit_types.length !== 0;
    const isLastLevelUndefined = levels[levels.length - 1] === undefined;

    return (
        <Box>
            {levels.map((orgUnitType, index) => {
                const isLastLevel = index === levels.length - 1;
                const canRemove = isLastLevel && index > 0;

                return (
                    <Grid container spacing={1} key={`level_${index}`}>
                        <Grid item xs={9}>
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
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <InputComponent
                                type="number"
                                keyValue={`org_unit_type_quantities_${index}`}
                                onChange={(_, value) =>
                                    handleOrgUnitTypeQuantityChange(
                                        value,
                                        index,
                                    )
                                }
                                labelString={formatMessage(MESSAGES.quantity)}
                                value={
                                    parameterValues?.org_unit_type_quantities[
                                        index
                                    ]
                                }
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
                    </Grid>
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
