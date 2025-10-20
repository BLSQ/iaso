import React, { FunctionComponent, useCallback, useMemo } from 'react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Grid, Collapse, Box } from '@mui/material';
import { grey } from '@mui/material/colors';
import { IconButton, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import {
    OrgUnitTypeHierarchy,
    OrgUnitTypeHierarchyDropdownValues,
    useGetOrgUnitTypesHierarchy,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { flattenHierarchy } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { SxStyles } from 'Iaso/types/general';
import { DropdownOptionsWithOriginal } from 'Iaso/types/utils';
import MESSAGES from '../../messages';
import { Planning } from '../../types/planning';
import { useGetCriteriaOptions } from './constants';
import { ExcludedOrgUnits } from './ExcludedOrgUnits';
import { ParameterValues } from './LQASForm';

const styles: SxStyles = {
    collapse: {
        p: 2,
        border: `1px solid ${grey[500]}`,
        borderRadius: 2,
        mt: 1,
        ml: 1,
        mr: 1,
    },
    grid: {
        p: 0,
    },
};

type Props = {
    parameterValues?: ParameterValues;
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
    isFetchingOrgunitTypes: boolean;
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
    orgunitTypes,
    isFetchingOrgunitTypes,
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
        | DropdownOptionsWithOriginal<number, OrgUnitTypeHierarchy>
        | undefined = useMemo(
        () =>
            orgunitTypes?.find(
                orgUnitType => orgUnitType.value === levels[index - 1],
            ),
        [orgunitTypes, levels, index],
    );
    const { data: orgUnitTypeHierarchy } = useGetOrgUnitTypesHierarchy(
        previousLevel?.value ? previousLevel.value : 0,
    );
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
            number,
            OrgUnitTypeHierarchy
        >[] = [];
        if (!previousLevel) {
            options = orgunitTypes;
        }

        if (!orgUnitTypeHierarchy?.sub_unit_types) return options;

        options = flattenHierarchy(
            orgUnitTypeHierarchy.sub_unit_types,
            orgUnitTypeId,
            parameterValues?.org_unit_type_sequence_identifiers,
        );
        return options;
    }, [
        previousLevel,
        orgUnitTypeHierarchy?.sub_unit_types,
        parameterValues,
        orgUnitTypeId,
        orgunitTypes,
    ]);
    const selectedOrgUnitTypeId = useMemo(
        () =>
            parameterValues?.org_unit_type_exceptions?.[index]
                ?.split(',')
                .map(id => parseInt(id, 10)) || [],
        [index, parameterValues?.org_unit_type_exceptions],
    );
    return (
        <Box key={`level_${index}`}>
            <Grid container spacing={1} alignItems="center">
                <Grid item xs={index === 0 ? 11 : 10}>
                    <InputComponent
                        withMarginTop={false}
                        type="select"
                        required
                        keyValue={`org_unit_type_sequence_identifiers_${index}`}
                        onChange={(_, value) => {
                            handleOrgUnitTypeChange(value, index);
                        }}
                        clearable={false}
                        labelString={`${formatMessage(MESSAGES.level)} ${index + 1}`}
                        value={orgUnitTypeId}
                        options={orgUnitTypesOptions}
                        loading={isFetchingOrgunitTypes}
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
                        <Box>
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
                    <Box>
                        <IconButton
                            size="small"
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
            <Collapse in={isExpanded}>
                <Box sx={styles.collapse}>
                    <Grid container spacing={1.2} sx={styles.grid}>
                        <Grid item xs={8}>
                            <InputComponent
                                withMarginTop={false}
                                type="select"
                                required
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
                                required
                                keyValue={`org_unit_type_quantities_${index}`}
                                onChange={(_, value) =>
                                    handleOrgUnitTypeQuantityChange(
                                        value,
                                        index,
                                    )
                                }
                                min={0}
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
                                selectedOrgUnitIds={selectedOrgUnitTypeId}
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
