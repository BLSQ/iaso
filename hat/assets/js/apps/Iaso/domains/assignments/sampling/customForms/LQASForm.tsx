import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
    useEffect,
    Dispatch,
    SetStateAction,
} from 'react';
import PlusIcon from '@mui/icons-material/Add';
import { Box, Button, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useSafeIntl } from 'bluesquare-components';
import { OrgUnitTypeHierarchyDropdownValues } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { useGetTaskDetails } from 'Iaso/domains/tasks/hooks/useGetTasks';
import { SxStyles } from 'Iaso/types/general';
import {
    addToArray,
    removeFromArray,
    updateArrayAtIndex,
} from 'Iaso/utils/arrays';
import MESSAGES from '../../messages';
import { Planning } from '../../types/planning';

import { Criteria, TaskStatus } from '../types';
import { Level } from './Level';

const styles: SxStyles = {
    paper: {
        backgroundColor: grey[200],
        p: 2,
        borderRadius: 2,
        mt: 2,
        elevation: 2,
    },
    subPaper: {
        backgroundColor: 'white',
        p: 2,
        borderRadius: 2,
        mt: 2,
        elevation: 2,
    },
    button: {
        mt: 2,
    },
    icon: {
        mr: 1,
    },
};
export type ParameterValues =
    | {
          org_unit_type_quantities?: number[];
          org_unit_type_sequence_identifiers?: number[];
          org_unit_type_exceptions?: string[];
          org_unit_type_criteria?: Criteria[];
      }
    | undefined;
type Props = {
    planning: Planning;
    setAllowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    parameterValues: ParameterValues;
    handleParameterChange: (parameterName: string, value: any) => void;
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
    isFetchingOrgunitTypes: boolean;
    taskStatus: TaskStatus;
    setExtraFilters: Dispatch<SetStateAction<Record<string, any>>>;
    taskId?: number;
};

export const LQASForm: FunctionComponent<Props> = ({
    planning,
    setAllowConfirm,
    parameterValues,
    handleParameterChange,
    orgunitTypes,
    isFetchingOrgunitTypes,
    taskStatus,
    taskId,
    setExtraFilters,
}) => {
    const { formatMessage } = useSafeIntl();
    const [expandedLevels, setExpandedLevels] = useState<boolean[]>([false]);

    const update = useCallback(
        (arrayName: string, index: number, value: any) => {
            const currentArray = parameterValues?.[arrayName] || [];
            const updatedArray = updateArrayAtIndex(index, value, currentArray);
            handleParameterChange(arrayName, updatedArray);
        },
        [parameterValues, handleParameterChange],
    );
    const add = useCallback(
        (arrayName: string, value: any = undefined) => {
            const currentArray = parameterValues?.[arrayName] || [];
            const updatedArray = addToArray(value, currentArray);
            handleParameterChange(arrayName, updatedArray);
            setExpandedLevels([...expandedLevels, true]);
        },
        [parameterValues, handleParameterChange, expandedLevels],
    );

    const remove = useCallback(
        (arrayName: string, index: number) => {
            const currentArray = parameterValues?.[arrayName] || [];
            const updatedArray = removeFromArray(index, currentArray);
            const expandedLevelsCopy = removeFromArray(index, expandedLevels);
            setExpandedLevels(expandedLevelsCopy);
            handleParameterChange(arrayName, updatedArray);
        },
        [parameterValues, handleParameterChange, expandedLevels],
    );

    const handleOrgUnitTypeChange = useCallback(
        (value: any, index: number) => {
            update('org_unit_type_criteria', index, 'RURAL/URBAN');
            update('org_unit_type_exceptions', index, undefined);
            update('org_unit_type_quantities', index, undefined);
            if (index === 0) {
                // Remove the whole hierarchy behind the selected org unit type
                handleParameterChange('org_unit_type_sequence_identifiers', [
                    parseInt(value, 10),
                ]);
                setExpandedLevels([true]);
                return;
            }
            if (index !== 0) {
                update(
                    'org_unit_type_sequence_identifiers',
                    index,
                    parseInt(value, 10),
                );
                return;
            }
        },
        [update, handleParameterChange],
    );

    const handleOrgUnitTypeQuantityChange = useCallback(
        (value: any, index: number) => {
            update(
                'org_unit_type_quantities',
                index,
                value ? parseInt(value, 10) : undefined,
            );
        },
        [update],
    );

    const handleAddLevel = useCallback(() => {
        add('org_unit_type_sequence_identifiers');
        add('org_unit_type_exceptions');
        add('org_unit_type_criteria');
        add('org_unit_type_quantities');
    }, [add]);

    const handleRemoveLevel = useCallback(
        (index: number) => {
            remove('org_unit_type_sequence_identifiers', index);
            remove('org_unit_type_quantities', index);
            remove('org_unit_type_criteria', index);
            remove('org_unit_type_exceptions', index);
        },
        [remove],
    );

    const handleCriteriaChange = useCallback(
        (value: any, index: number) => {
            update('org_unit_type_criteria', index, value);
        },
        [update],
    );

    const { data: taskDetails } = useGetTaskDetails(
        taskStatus === 'SUCCESS' ? taskId : undefined,
    );
    useEffect(() => {
        if (taskDetails?.result?.group_id) {
            setExtraFilters({
                group: taskDetails.result.group_id,
            });
        }
    }, [taskDetails?.result?.group_id, setExtraFilters]);

    // Memoized values
    const levels = useMemo(() => {
        const orgunitTypeIds =
            parameterValues?.org_unit_type_sequence_identifiers;
        return orgunitTypeIds?.length && orgunitTypeIds.length > 0
            ? orgunitTypeIds
            : [undefined];
    }, [parameterValues?.org_unit_type_sequence_identifiers]);

    const latestOptions = useMemo(() => {
        const lastLevel = levels[levels.length - 1];
        return lastLevel
            ? orgunitTypes?.find(orgUnitType => orgUnitType.value === lastLevel)
            : undefined;
    }, [orgunitTypes, levels]);
    const canAddLevel = latestOptions?.original?.sub_unit_types.length !== 0;
    const isLastLevelUndefined = levels[levels.length - 1] === undefined;

    useEffect(() => {
        if (
            parameterValues?.org_unit_type_sequence_identifiers?.length &&
            parameterValues?.org_unit_type_sequence_identifiers?.length > 0 &&
            !canAddLevel
        ) {
            const allLevelsFilled =
                parameterValues.org_unit_type_sequence_identifiers?.every(
                    (level, index) => {
                        return (
                            level !== undefined &&
                            parameterValues.org_unit_type_criteria?.[index] !==
                                undefined &&
                            parameterValues.org_unit_type_quantities?.[
                                index
                            ] !== undefined
                        );
                    },
                );
            setAllowConfirm(Boolean(allLevelsFilled));
        } else {
            setAllowConfirm(false);
        }
    }, [setAllowConfirm, parameterValues, canAddLevel]);
    return (
        <Paper sx={styles.paper}>
            {levels.map((orgUnitTypeId, index) => {
                return (
                    <Paper
                        key={orgUnitTypeId || 'last_level'}
                        sx={styles.subPaper}
                    >
                        <Level
                            orgunitTypes={orgunitTypes || []}
                            isFetchingOrgunitTypes={isFetchingOrgunitTypes}
                            index={index}
                            levels={levels}
                            handleOrgUnitTypeChange={handleOrgUnitTypeChange}
                            handleOrgUnitTypeQuantityChange={
                                handleOrgUnitTypeQuantityChange
                            }
                            handleRemoveLevel={handleRemoveLevel}
                            orgUnitTypeId={orgUnitTypeId}
                            handleParameterChange={handleParameterChange}
                            parameterValues={parameterValues}
                            planning={planning}
                            handleCriteriaChange={handleCriteriaChange}
                            expandedLevels={expandedLevels}
                            setExpandedLevels={setExpandedLevels}
                        />
                    </Paper>
                );
            })}
            {canAddLevel && (
                <Box display="flex" justifyContent="flex-end">
                    <Button
                        onClick={handleAddLevel}
                        variant="contained"
                        color="primary"
                        sx={styles.button}
                        disabled={isLastLevelUndefined}
                    >
                        <PlusIcon sx={styles.icon} />
                        {formatMessage(MESSAGES.addLevel)}
                    </Button>
                </Box>
            )}
        </Paper>
    );
};
