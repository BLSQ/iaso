import React, { FC, useCallback, useMemo, useState } from 'react';
import PublicIcon from '@mui/icons-material/Public';
import {
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { useGetTeamTree } from 'Iaso/domains/teams/hooks/requests/useGetTeamTree';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import { useGetPlanningRootOrgUnit } from '../../hooks/requests/useGetPlanningRootOrgUnit';
import MESSAGES from '../../messages';
import { PlanningStepCard } from '../shared/PlanningStepCard';
import { LevelMembersChips } from './LevelMembersChips';
import { LevelRow } from './LevelRow';
import { PlanningLevel } from './types';
import { useGetDescendantOrgUnitTypes } from './useGetDescendantOrgUnitTypes';
import {
    EMPTY_LEVEL,
    getLevelMembers,
    getLevelTypeOptions,
    validateLevelTypes,
} from './utils';

const styles = {
    table: {
        tableLayout: 'fixed',
        '& tbody tr:nth-of-type(even)': { bgcolor: 'action.hover' },
        '& td': { verticalAlign: 'middle' },
    },
    rootIcon: {
        fontSize: '1.1rem',
        color: 'text.secondary',
    },
    count: {
        fontWeight: 'bold',
    },
    levelColumn: { width: 140 },
    membersColumn: { width: 200 },
    countColumn: { width: 120 },
    emptyMessage: {
        p: 2,
    },
} satisfies SxStyles;

const ROOT_LEVEL_MEMBERS = { teamsCount: 1, usersCount: 0 };

export const OrgUnitLevelsSection: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { formik } = usePlanningContext();
    const { selectedOrgUnit, selectedTeam, levels = [] } = formik.values;
    const { setFieldValue } = formik;

    const { data: rootOrgUnit } = useGetPlanningRootOrgUnit(selectedOrgUnit);
    const { data: types = [] } = useGetDescendantOrgUnitTypes(selectedOrgUnit);
    const { data: teamTree } = useGetTeamTree(selectedTeam);

    const levelMembers = useMemo(
        () => (teamTree ? getLevelMembers(teamTree) : []),
        [teamTree],
    );
    const levelsCount = levelMembers.length;

    // Required errors only show once a level was edited, other errors show right away.
    const [editedLevelIndexes, setEditedLevelIndexes] = useState(
        () => new Set<number>(),
    );
    const typeErrors = useMemo(
        () =>
            validateLevelTypes(levels, levelsCount, types).map(
                (error, index) =>
                    error === 'requiredField' && !editedLevelIndexes.has(index)
                        ? undefined
                        : error,
            ),
        [levels, levelsCount, types, editedLevelIndexes],
    );

    const updateLevel = useCallback(
        (index: number, changes: Partial<PlanningLevel>) => {
            const nextLevels = Array.from(
                { length: levelsCount },
                (_, levelIndex) => levels[levelIndex] ?? EMPTY_LEVEL,
            );
            nextLevels[index] = { ...nextLevels[index], ...changes };
            setFieldValue('levels', nextLevels);
            setEditedLevelIndexes(previous => new Set(previous).add(index));
        },
        [levels, levelsCount, setFieldValue],
    );

    const title = formatMessage(MESSAGES.orgUnitsToAssign);
    if (!rootOrgUnit || !selectedTeam) {
        return (
            <PlanningStepCard step={3} title={title}>
                <Typography color="text.secondary">
                    {formatMessage(MESSAGES.selectGeographyAndRootTeamFirst)}
                </Typography>
            </PlanningStepCard>
        );
    }
    return (
        <PlanningStepCard
            step={3}
            title={title}
            description={formatMessage(
                MESSAGES.orgUnitLevelsInfos,
                numericValues({ count: levelsCount + 1 }),
            )}
            disableContentPadding
        >
            <Table sx={styles.table}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={styles.levelColumn}>
                            {formatMessage(MESSAGES.level)}
                        </TableCell>
                        <TableCell sx={styles.membersColumn}>
                            {formatMessage(MESSAGES.teamsAndUsers)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.orgUnitTypes)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.orgUnitGroups)}
                        </TableCell>
                        <TableCell align="right" sx={styles.countColumn}>
                            {formatMessage(MESSAGES.orgUnits)}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>
                            <Typography fontWeight="bold">
                                {formatMessage(MESSAGES.rootLevel)}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {formatMessage(MESSAGES.selectOrgUnit)}
                            </Typography>
                        </TableCell>
                        <TableCell>
                            <LevelMembersChips members={ROOT_LEVEL_MEMBERS} />
                        </TableCell>
                        <TableCell>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <PublicIcon sx={styles.rootIcon} />
                                <Typography>
                                    {`${rootOrgUnit.name} (${rootOrgUnit.org_unit_type_name})`}
                                </Typography>
                            </Stack>
                        </TableCell>
                        <TableCell>--</TableCell>
                        <TableCell align="right">
                            <Typography sx={styles.count}>1</Typography>
                        </TableCell>
                    </TableRow>
                    {React.Children.toArray(
                        levelMembers.map((members, index) => (
                            <LevelRow
                                index={index}
                                level={levels[index] ?? EMPTY_LEVEL}
                                members={members}
                                isDeepest={index === levelsCount - 1}
                                typeOptions={getLevelTypeOptions(
                                    levels,
                                    index,
                                    types,
                                )}
                                typeError={typeErrors[index]}
                                sourceVersionId={rootOrgUnit.version_id}
                                rootOrgUnitId={selectedOrgUnit}
                                onChange={updateLevel}
                            />
                        )),
                    )}
                </TableBody>
            </Table>
        </PlanningStepCard>
    );
};
