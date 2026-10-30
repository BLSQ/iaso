import React, { FC, useCallback, useMemo, useState } from 'react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    ButtonBase,
    Stack,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { useGetGroupDropdown } from 'Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { SxStyles } from 'Iaso/types/general';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import MESSAGES from '../../messages';
import { LevelCountBreakdown } from './LevelCountBreakdown';
import { LevelIssues } from './LevelIssues';
import { LevelMembersChips } from './LevelMembersChips';
import {
    LevelMembers,
    LevelOrgUnitType,
    LevelTypeError,
    PlanningLevel,
} from './types';
import { useGetLevelOrgUnitCounts } from './useGetLevelOrgUnitCounts';
import { EMPTY_LEVEL, getGroupIds, getLevelIssues } from './utils';

const styles = {
    row: {
        '& > td': { verticalAlign: 'top' },
    },
    rowWithDetails: {
        '& > td': { borderBottom: 'none' },
    },
    detailsCell: {
        pt: 0,
    },
    count: {
        fontWeight: 'bold',
    },
    emptyCount: {
        color: 'error.main',
    },
    countButton: {
        gap: 0.5,
        ml: 'auto',
        py: 0.5,
        pl: 0.75,
        pr: 0.25,
        borderRadius: 1,
        textAlign: 'right',
        '&:hover': { bgcolor: 'action.hover' },
    },
    countButtonIcon: {
        color: 'action.active',
    },
} satisfies SxStyles;

type Props = {
    index: number;
    level: PlanningLevel;
    members: LevelMembers;
    isDeepest: boolean;
    typeOptions: LevelOrgUnitType[];
    typeError?: LevelTypeError;
    sourceVersionId?: number;
    rootOrgUnitId?: number;
    rootOrgUnitName: string;
    levelAbove?: PlanningLevel;
    onChange: (index: number, changes: Partial<PlanningLevel>) => void;
    disabled?: boolean;
};

export const LevelRow: FC<Props> = ({
    index,
    level,
    members,
    isDeepest,
    typeOptions,
    typeError,
    sourceVersionId,
    rootOrgUnitId,
    rootOrgUnitName,
    levelAbove,
    onChange,
    disabled = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: counts } = useGetLevelOrgUnitCounts({
        rootOrgUnitId,
        level,
    });

    // Same query as the row above, served from the cache.
    const { data: levelAboveCounts } = useGetLevelOrgUnitCounts({
        rootOrgUnitId,
        level: levelAbove ?? EMPTY_LEVEL,
    });
    const hasTypes = level.orgUnitTypeIds.length > 0;
    const isLevelAboveMissingTypes =
        index > 0 && !levelAbove?.orgUnitTypeIds.length;
    const hasGroups = level.groups.length > 0;
    const levelCounts = hasTypes ? counts : undefined;
    const selectedTypes = useMemo(
        () =>
            typeOptions.filter(type => level.orgUnitTypeIds.includes(type.id)),
        [typeOptions, level.orgUnitTypeIds],
    );
    const issues = useMemo(
        () =>
            levelCounts
                ? getLevelIssues({
                      selectedTypes,
                      counts: levelCounts,
                      hasGroups,
                      levelAboveCount: levelAboveCounts?.total,
                  })
                : [],
        [levelCounts, selectedTypes, hasGroups, levelAboveCounts],
    );
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
    const toggleBreakdown = useCallback(
        () => setIsBreakdownOpen(isOpen => !isOpen),
        [],
    );
    const hasDetails =
        issues.length > 0 || (isBreakdownOpen && Boolean(levelCounts));
    const { data: levelGroupOptions } = useGetGroupDropdown(
        {
            sourceVersionId,
            orgUnitTypeIds: level.orgUnitTypeIds.join(','),
            orgUnitParentId: rootOrgUnitId,
        },
        hasTypes && Boolean(sourceVersionId),
    );

    // A group holding none of this level's org unit types belongs to another level.
    // It is no longer offered, but stays listed so it can be seen and removed.
    const misalignedGroups = useMemo(
        () =>
            level.groups.filter(
                group => counts?.countByGroupId.get(group.id) === 0,
            ),
        [level.groups, counts],
    );
    const misalignedGroupNames = misalignedGroups.map(group => group.name);
    const groupOptions = useMemo(
        () => [
            ...(levelGroupOptions ?? []),
            ...misalignedGroups.map(group => ({
                value: group.id,
                label: group.name,
            })),
        ],
        [levelGroupOptions, misalignedGroups],
    );

    const handleTypesChange = useCallback(
        (_key: string, value: string) =>
            onChange(index, {
                orgUnitTypeIds: commaSeparatedIdsToArray(value),
            }),
        [index, onChange],
    );
    const handleGroupsChange = useCallback(
        (_key: string, value: string) => {
            const selectedIds = commaSeparatedIdsToArray(value);
            const groups = groupOptions
                .filter(option => selectedIds.includes(option.value))
                .map(option => ({ id: option.value, name: option.label }));
            onChange(index, { groups });
        },
        [groupOptions, index, onChange],
    );

    return (
        <TableBody>
            <TableRow sx={[styles.row, hasDetails && styles.rowWithDetails]}>
                <TableCell>
                    <Typography fontWeight="bold">
                        {formatMessage(
                            MESSAGES.levelNumber,
                            numericValues({ number: index + 1 }),
                        )}
                    </Typography>
                    {isDeepest && (
                        <Typography variant="caption" color="text.secondary">
                            {formatMessage(MESSAGES.deepestLevel)}
                        </Typography>
                    )}
                </TableCell>
                <TableCell>
                    <LevelMembersChips members={members} />
                </TableCell>
                <TableCell>
                    <InputComponent
                        type="select"
                        multi
                        keyValue={`level-${index}-orgUnitTypes`}
                        value={level.orgUnitTypeIds}
                        onChange={handleTypesChange}
                        options={typeOptions.map(type => ({
                            value: type.id,
                            label: type.name,
                        }))}
                        label={MESSAGES.orgUnitTypes}
                        disabled={isLevelAboveMissingTypes && !hasTypes}
                        helperText={
                            isLevelAboveMissingTypes
                                ? formatMessage(
                                      MESSAGES.selectLevelAboveTypesFirst,
                                  )
                                : undefined
                        }
                        errors={
                            typeError
                                ? [formatMessage(MESSAGES[typeError])]
                                : []
                        }
                        required
                        withMarginTop={false}
                        disabled={disabled}
                    />
                </TableCell>
                <TableCell>
                    <InputComponent
                        type="select"
                        multi
                        keyValue={`level-${index}-groups`}
                        value={getGroupIds(level)}
                        onChange={handleGroupsChange}
                        options={groupOptions}
                        disabled={disabled || !hasTypes}
                        label={MESSAGES.orgUnitGroups}
                        placeholder={formatMessage(MESSAGES.allOrgUnits)}
                        errors={
                            misalignedGroupNames.length > 0
                                ? [
                                      formatMessage(
                                          MESSAGES.groupsWithoutLevelOrgUnits,
                                          {
                                              groups: misalignedGroupNames.join(
                                                  ', ',
                                              ),
                                          },
                                      ),
                                  ]
                                : []
                        }
                        withMarginTop={false}
                    />
                </TableCell>
                <TableCell align="right">
                    {levelCounts ? (
                        <ButtonBase
                            onClick={toggleBreakdown}
                            aria-expanded={isBreakdownOpen}
                            title={formatMessage(MESSAGES.whyThisCount)}
                            sx={styles.countButton}
                        >
                            <Stack alignItems="flex-end">
                                <Typography
                                    sx={[
                                        styles.count,
                                        levelCounts.total === 0 &&
                                            styles.emptyCount,
                                    ]}
                                >
                                    {levelCounts.total}
                                </Typography>
                                {hasGroups && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {formatMessage(
                                            MESSAGES.ofTotal,
                                            numericValues({
                                                total: levelCounts.typesTotal,
                                            }),
                                        )}
                                    </Typography>
                                )}
                            </Stack>
                            {isBreakdownOpen ? (
                                <ExpandLessIcon sx={styles.countButtonIcon} />
                            ) : (
                                <ExpandMoreIcon sx={styles.countButtonIcon} />
                            )}
                        </ButtonBase>
                    ) : (
                        <Typography sx={styles.count}>
                            {textPlaceholder}
                        </Typography>
                    )}
                </TableCell>
            </TableRow>
            {hasDetails && (
                <TableRow>
                    <TableCell />
                    <TableCell colSpan={4} sx={styles.detailsCell}>
                        <Stack gap={1.5}>
                            <LevelIssues
                                issues={issues}
                                rootOrgUnitName={rootOrgUnitName}
                            />
                            {isBreakdownOpen && levelCounts && (
                                <LevelCountBreakdown
                                    levelNumber={index + 1}
                                    selectedTypes={selectedTypes}
                                    counts={levelCounts}
                                    hasGroups={hasGroups}
                                    rootOrgUnitName={rootOrgUnitName}
                                />
                            )}
                        </Stack>
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    );
};
