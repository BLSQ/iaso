import React, { FunctionComponent, useMemo } from 'react';
import { Grid } from '@mui/material';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OriginalOrgUnitType } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetOrgUnitTypesHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
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

    const previousLevel:
        | DropdownOptionsWithOriginal<string, OriginalOrgUnitType>
        | undefined = useMemo(
        () =>
            orgUnitTypes?.find(
                orgUnitType => orgUnitType.value === `${levels[index - 1]}`,
            ),
        [orgUnitTypes, levels, index],
    );
    const { data: orgUnitTypeHierarchy } = useGetOrgUnitTypesHierarchy(
        previousLevel?.value ? parseInt(previousLevel.value, 10) : 0,
    );
    const orgUnitTypesOptions = useMemo(() => {
        let options: DropdownOptionsWithOriginal<
            string,
            OriginalOrgUnitType
        >[] = [];
        if (!previousLevel) {
            // First level: use all available org unit types
            options = orgUnitTypes;
        }

        // Other levels: flatten the hierarchy and remove the previous level
        if (!orgUnitTypeHierarchy?.sub_unit_types) return options;

        const flattenHierarchy = (items: any[], level = 0): any[] => {
            return items.flatMap(item => {
                if (
                    parameterValues?.org_unit_type_sequence_identifiers?.includes(
                        item.id,
                    ) &&
                    item.id !== orgUnitTypeId
                ) {
                    return [];
                }

                const currentItem = {
                    value: item.id,
                    label: item.name,
                    original: item,
                };

                // Recursively flatten children
                const children =
                    item.sub_unit_types && item.sub_unit_types.length > 0
                        ? flattenHierarchy(item.sub_unit_types, level + 1)
                        : [];

                return [currentItem, ...children];
            });
        };

        options = flattenHierarchy(orgUnitTypeHierarchy.sub_unit_types);
        return options;
    }, [
        previousLevel,
        orgUnitTypeHierarchy?.sub_unit_types,
        orgUnitTypes,
        parameterValues?.org_unit_type_sequence_identifiers,
        orgUnitTypeId,
    ]);

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
                    options={orgUnitTypesOptions}
                    loading={isFetchingOrgUnitTypes}
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
