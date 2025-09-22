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
    const handleOrgUnitTypeChange = useCallback(
        (value: any, index: number) => {
            const currentArray =
                parameterValues?.org_unit_type_sequence_identifiers || [];
            const updatedArray = [...currentArray];
            updatedArray[index] = parseInt(value, 10); // Convert to int
            handleParameterChange(
                'org_unit_type_sequence_identifiers',
                updatedArray,
            );
        },
        [parameterValues, handleParameterChange],
    );
    const handleOrgUnitTypeQuantityChange = useCallback(
        (value: any, index: number) => {
            const currentArray =
                parameterValues?.org_unit_type_quantities || [];
            const updatedArray = [...currentArray];
            updatedArray[index] = parseInt(value, 10); // Convert to int
            handleParameterChange('org_unit_type_quantities', updatedArray);
        },
        [parameterValues, handleParameterChange],
    );
    const handleAddLevel = useCallback(() => {
        const currentArray =
            parameterValues?.org_unit_type_sequence_identifiers || [];
        const updatedArray = [...currentArray];
        updatedArray.push(undefined);
        handleParameterChange(
            'org_unit_type_sequence_identifiers',
            updatedArray,
        );
    }, [parameterValues, handleParameterChange]);
    const handleRemoveLevel = useCallback(
        (index: number) => {
            const currentArray =
                parameterValues?.org_unit_type_sequence_identifiers || [];
            const updatedArray = [...currentArray];
            updatedArray.splice(index, 1);
            handleParameterChange(
                'org_unit_type_sequence_identifiers',
                updatedArray,
            );
        },
        [parameterValues, handleParameterChange],
    );
    const levels = useMemo(() => {
        return parameterValues?.org_unit_type_sequence_identifiers.length > 0
            ? parameterValues?.org_unit_type_sequence_identifiers
            : [undefined];
    }, [parameterValues]);
    const latestOptions = useMemo(() => {
        return levels[levels.length - 1]
            ? orgUnitTypes?.find(
                  orgUnitType =>
                      orgUnitType.value === `${levels[levels.length - 1]}`,
              )
            : undefined;
    }, [orgUnitTypes, levels]);
    return (
        <Box>
            {levels.map((orgUnitType, index) => {
                const previousLevel =
                    index > 0
                        ? orgUnitTypes?.find(
                              orgUnitType =>
                                  orgUnitType.value === `${levels[index - 1]}`,
                          )
                        : undefined;
                const options = previousLevel
                    ? orgUnitTypes?.filter(orgUnitType =>
                          previousLevel.original?.sub_unit_types.includes(
                              orgUnitType.original?.id,
                          ),
                      )
                    : orgUnitTypes;
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
                                options={options}
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
                                disabled={
                                    index !== levels.length - 1 || index === 0
                                }
                                onClick={() => handleRemoveLevel(index)}
                                tooltipMessage={MESSAGES.removeLevel}
                            />
                        </Grid>
                    </Grid>
                );
            })}
            {latestOptions?.original?.sub_unit_types.length !== 0 && (
                <Button
                    onClick={() => handleAddLevel()}
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    disabled={levels[levels.length - 1] === undefined}
                >
                    <PlusIcon sx={{ mr: 1 }} />
                    {formatMessage(MESSAGES.addLevel)}
                </Button>
            )}
        </Box>
    );
};
