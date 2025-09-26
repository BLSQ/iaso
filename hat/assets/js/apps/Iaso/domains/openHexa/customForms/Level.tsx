import React, { FunctionComponent, useCallback, useMemo } from 'react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Grid, Collapse, Box } from '@mui/material';
import { grey } from '@mui/material/colors';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OriginalOrgUnitType } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetOrgUnitTypesHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { DropdownOptionsWithOriginal } from 'Iaso/types/utils';
import { Planning } from '../../assignments/types/planning';
import { MESSAGES } from '../messages';
import { useGetCriteriaOptions } from './constants';
import { ExcludedOrgUnits } from './ExcludedOrgUnits';
import { ParameterValues } from './LQASForm';

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
    handleCriteriaChange: (value: any, index: number) => void;
    expandedLevels: boolean[];
    setExpandedLevels: (expandedLevels: boolean[]) => void;
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
    handleCriteriaChange,
    planning,
    expandedLevels,
    setExpandedLevels,
}) => {
    const { formatMessage } = useSafeIntl();
    const criteriaOptions = useGetCriteriaOptions();

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
    console.log(expandedLevels);
    const isExpanded = expandedLevels[index];
    const handleSetIsExpanded = useCallback(
        (value: boolean) => {
            setExpandedLevels(
                expandedLevels.map((_, i) =>
                    i === index ? value : expandedLevels[i],
                ),
            );
        },
        [expandedLevels, setExpandedLevels, index],
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
        <Box key={`level_${index}`}>
            <Grid container spacing={1} alignItems="center">
                <Grid item xs={index === 0 ? 11 : 10}>
                    <InputComponent
                        type="select"
                        keyValue={`org_unit_type_sequence_identifiers_${index}`}
                        onChange={(_, value) => {
                            handleOrgUnitTypeChange(value, index);
                        }}
                        clearable={false}
                        labelString={`${formatMessage(MESSAGES.level)} ${index + 1}`}
                        value={orgUnitTypeId}
                        options={orgUnitTypesOptions}
                        loading={isFetchingOrgUnitTypes}
                    />
                </Grid>
                {index !== 0 && (
                    <Grid
                        item
                        xs={1}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Box sx={{ mt: '11px' }}>
                            <IconButton
                                icon="delete"
                                size="small"
                                onClick={() => handleRemoveLevel(index)}
                                tooltipMessage={MESSAGES.removeLevel}
                            />
                        </Box>
                    </Grid>
                )}

                <Grid
                    item
                    xs={1}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Box sx={{ mt: '11px' }}>
                        <IconButton
                            size="small"
                            disabled={!orgUnitTypeId}
                            overrideIcon={
                                isExpanded ? ExpandLessIcon : ExpandMoreIcon
                            }
                            onClick={() => handleSetIsExpanded(!isExpanded)}
                            tooltipMessage={
                                isExpanded ? MESSAGES.collapse : MESSAGES.expand
                            }
                        />
                    </Box>
                </Grid>
            </Grid>

            {/* Collapsible content */}
            <Collapse in={isExpanded}>
                <Box
                    sx={{
                        p: 2,
                        border: `1px solid ${grey[500]}`,
                        borderRadius: 2,
                        mt: 1,
                        ml: 1,
                        mr: 1,
                    }}
                >
                    <Grid container spacing={1.2} sx={{ p: 0 }}>
                        <Grid item xs={8}>
                            <InputComponent
                                withMarginTop={false}
                                type="select"
                                keyValue={`org_unit_type_criteria_${index}`}
                                onChange={(_, value) => {
                                    handleCriteriaChange(value, index);
                                }}
                                clearable={false}
                                labelString="Criteria"
                                value={
                                    parameterValues?.org_unit_type_criteria?.[
                                        index
                                    ] || criteriaOptions[0].value
                                }
                                options={criteriaOptions}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <InputComponent
                                withMarginTop={false}
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
                                    parameterValues?.org_unit_type_quantities?.[
                                        index
                                    ]
                                }
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <ExcludedOrgUnits
                                index={index}
                                selectedOrgUnitIds={
                                    parameterValues?.org_unit_type_exceptions?.[
                                        index
                                    ] || []
                                }
                                orgUnitTypeId={orgUnitTypeId}
                                handleParameterChange={handleParameterChange}
                                parameterValues={parameterValues}
                                planning={planning}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>
        </Box>
    );
};
