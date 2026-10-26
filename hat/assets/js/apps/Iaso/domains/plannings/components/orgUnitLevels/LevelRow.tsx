import React, { FC, useCallback } from 'react';
import { TableCell, TableRow, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { useGetGroupDropdown } from 'Iaso/domains/orgUnits/hooks/requests/useGetGroups';
import { SxStyles } from 'Iaso/types/general';
import { DropdownOptions } from 'Iaso/types/utils';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import MESSAGES from '../../messages';
import { LevelMembersChips } from './LevelMembersChips';
import {
    LevelMembers,
    LevelOrgUnitType,
    LevelTypeError,
    PlanningLevel,
} from './types';
import { useGetLevelOrgUnitCounts } from './useGetLevelOrgUnitCounts';

const styles = {
    row: {
        '& > td': { verticalAlign: 'top' },
    },
    count: {
        fontWeight: 'bold',
    },
} satisfies SxStyles;

type Props = {
    index: number;
    level: PlanningLevel;
    members: LevelMembers;
    isDeepest: boolean;
    typeOptions: LevelOrgUnitType[];
    typeError?: LevelTypeError;
    versionGroupOptions: DropdownOptions<number>[];
    sourceVersionId?: number;
    rootOrgUnitId?: number;
    onChange: (index: number, changes: Partial<PlanningLevel>) => void;
};

export const LevelRow: FC<Props> = ({
    index,
    level,
    members,
    isDeepest,
    typeOptions,
    typeError,
    versionGroupOptions,
    sourceVersionId,
    rootOrgUnitId,
    onChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: counts } = useGetLevelOrgUnitCounts({
        rootOrgUnitId,
        level,
    });

    const hasTypes = level.orgUnitTypeIds.length > 0;
    const { data: levelGroupOptions = [] } = useGetGroupDropdown(
        {
            sourceVersionId,
            orgUnitTypeIds: level.orgUnitTypeIds.join(','),
            orgUnitParentId: rootOrgUnitId,
        },
        hasTypes && Boolean(sourceVersionId),
    );

    // A group holding none of this level's org unit types belongs to another level.
    // It is no longer offered, but stays listed so it can be seen and removed.
    const misalignedGroupOptions = versionGroupOptions.filter(
        option => counts?.countByGroupId.get(option.value) === 0,
    );
    const misalignedGroupNames = misalignedGroupOptions.map(
        option => option.label,
    );
    const groupOptions = [...levelGroupOptions, ...misalignedGroupOptions];

    const handleTypesChange = useCallback(
        (_key: string, value: string) =>
            onChange(index, {
                orgUnitTypeIds: commaSeparatedIdsToArray(value),
            }),
        [index, onChange],
    );
    const handleGroupsChange = useCallback(
        (_key: string, value: string) =>
            onChange(index, { groupIds: commaSeparatedIdsToArray(value) }),
        [index, onChange],
    );

    return (
        <TableRow sx={styles.row}>
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
                    errors={
                        typeError ? [formatMessage(MESSAGES[typeError])] : []
                    }
                    required
                    withMarginTop={false}
                />
            </TableCell>
            <TableCell>
                <InputComponent
                    type="select"
                    multi
                    keyValue={`level-${index}-groups`}
                    value={level.groupIds}
                    onChange={handleGroupsChange}
                    options={groupOptions}
                    disabled={!hasTypes}
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
                <Typography sx={styles.count}>
                    {hasTypes && counts ? counts.total : textPlaceholder}
                </Typography>
            </TableCell>
        </TableRow>
    );
};
