import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
    useEffect,
} from 'react';
import PlusIcon from '@mui/icons-material/Add';
import { Box, Button, Paper } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useSafeIntl } from 'bluesquare-components';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { SxStyles } from 'Iaso/types/general';
import { Planning } from '../../assignments/types/planning';
import { MESSAGES } from '../messages';
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
type Criteria = 'RURAL/URBAN' | 'URBAN' | 'RURAL';
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
};

export const LQASForm: FunctionComponent<Props> = ({
    planning,
    setAllowConfirm,
    parameterValues,
    handleParameterChange,
}) => {
    // console.log('parameterValues', parameterValues);
    useEffect(() => {
        if (
            parameterValues &&
            parameterValues?.org_unit_type_sequence_identifiers?.length &&
            parameterValues?.org_unit_type_sequence_identifiers?.length > 0
        ) {
            const allLevelsFilled =
                parameterValues?.org_unit_type_sequence_identifiers?.every(
                    (level, index) => {
                        return (
                            level !== undefined &&
                            parameterValues?.org_unit_type_criteria?.[index] !==
                                undefined &&
                            parameterValues?.org_unit_type_quantities?.[
                                index
                            ] !== undefined
                        );
                    },
                );
            setAllowConfirm(Boolean(allLevelsFilled));
        } else {
            setAllowConfirm(false);
        }
    }, [setAllowConfirm, parameterValues]);
    const { formatMessage } = useSafeIntl();
    const [expandedLevels, setExpandedLevels] = useState<boolean[]>([false]);
    const { data: orgUnitTypes, isFetching: isFetchingOrgUnitTypes } =
        useGetOrgUnitTypesDropdownOptions({
            projectId: planning.project,
        });
    const updateArrayAtIndex = useCallback(
        (arrayName: string, index: number, value: any) => {
            const currentArray = parameterValues?.[arrayName] || [];
            const updatedArray = [...currentArray];
            updatedArray[index] = value;
            handleParameterChange(arrayName, updatedArray);
        },
        [parameterValues, handleParameterChange],
    );

    const addToArray = useCallback(
        (arrayName: string, value: any = undefined) => {
            const currentArray = parameterValues?.[arrayName] || [];
            handleParameterChange(arrayName, [...currentArray, value]);
            setExpandedLevels([...expandedLevels, true]);
        },
        [parameterValues, handleParameterChange, expandedLevels],
    );

    const removeFromArray = useCallback(
        (arrayName: string, index: number) => {
            const currentArray = parameterValues?.[arrayName] || [];
            const updatedArray = [...currentArray];
            updatedArray.splice(index, 1);
            const expandedLevelsCopy = [...expandedLevels];
            expandedLevelsCopy.splice(index, 1);
            setExpandedLevels(expandedLevelsCopy);
            handleParameterChange(arrayName, updatedArray);
        },
        [parameterValues, handleParameterChange, expandedLevels],
    );

    const handleOrgUnitTypeChange = useCallback(
        (value: any, index: number) => {
            updateArrayAtIndex('org_unit_type_criteria', index, 'RURAL/URBAN');
            updateArrayAtIndex('org_unit_type_exceptions', index, undefined);
            updateArrayAtIndex('org_unit_type_quantities', index, undefined);
            if (index === 0) {
                // Remove the whole hierarchy behind the selected org unit type
                handleParameterChange('org_unit_type_sequence_identifiers', [
                    parseInt(value, 10),
                ]);
                setExpandedLevels([true]);
                return;
            }
            if (index !== 0) {
                updateArrayAtIndex(
                    'org_unit_type_sequence_identifiers',
                    index,
                    parseInt(value, 10),
                );
                return;
            }
        },
        [updateArrayAtIndex, handleParameterChange],
    );

    const handleOrgUnitTypeQuantityChange = useCallback(
        (value: any, index: number) => {
            updateArrayAtIndex(
                'org_unit_type_quantities',
                index,
                value ? parseInt(value, 10) : undefined,
            );
        },
        [updateArrayAtIndex],
    );

    const handleAddLevel = useCallback(() => {
        addToArray('org_unit_type_sequence_identifiers');
        addToArray('org_unit_type_exceptions');
        addToArray('org_unit_type_criteria');
        addToArray('org_unit_type_quantities');
    }, [addToArray]);

    const handleRemoveLevel = useCallback(
        (index: number) => {
            removeFromArray('org_unit_type_sequence_identifiers', index);
            removeFromArray('org_unit_type_quantities', index);
            removeFromArray('org_unit_type_criteria', index);
            removeFromArray('org_unit_type_exceptions', index);
        },
        [removeFromArray],
    );

    const handleCriteriaChange = useCallback(
        (value: any, index: number) => {
            updateArrayAtIndex('org_unit_type_criteria', index, value);
        },
        [updateArrayAtIndex],
    );

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
            ? orgUnitTypes?.find(
                  orgUnitType => orgUnitType.value === `${lastLevel}`,
              )
            : undefined;
    }, [orgUnitTypes, levels]);

    const canAddLevel = latestOptions?.original?.sub_unit_types.length !== 0;
    const isLastLevelUndefined = levels[levels.length - 1] === undefined;

    return (
        <Paper sx={styles.paper}>
            {levels.map((orgUnitTypeId, index) => {
                return (
                    <Paper
                        key={orgUnitTypeId || 'last_level'}
                        sx={styles.subPaper}
                    >
                        <Level
                            orgUnitTypes={orgUnitTypes || []}
                            isFetchingOrgUnitTypes={isFetchingOrgUnitTypes}
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
