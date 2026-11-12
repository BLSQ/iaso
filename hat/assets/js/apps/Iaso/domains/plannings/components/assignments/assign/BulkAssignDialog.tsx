import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import {
    Box,
    Button,
    Checkbox,
    List,
    ListItemButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { ColorBadge } from 'Iaso/components/ColorBadge';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { useUpdateAssignments } from '../api/useUpdateAssignments';
import { AssigneeRef } from '../api/utils';
import { AssigneeCell } from '../mainPanel/AssigneeCell';
import { OrgUnitRow } from '../mainPanel/types';
import { useLevelOrgUnitRows } from '../mainPanel/useLevelOrgUnitRows';
import { TeamMember } from '../utils';
import { useConfirmPublishedChange } from './PublishedPlanningConfirmation';
import { useAssignableOrgUnits } from './useAssignableOrgUnits';
import {
    countClearedByReassign,
    filterByName,
    getOrgUnitIdsAssignedTo,
} from './utils';

const styles = {
    assignee: {
        gap: 1,
        mb: 2,
    },
    colorBadge: {
        width: 16,
        height: 16,
        border: 'none',
        borderRadius: '3px',
    },
    actions: {
        gap: 1,
        my: 1,
        flexWrap: 'wrap',
    },
    list: {
        height: 360,
        overflow: 'auto',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
    },
    row: {
        gap: 1,
        py: 0.25,
    },
    name: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
    },
    offMapIcon: {
        fontSize: 16,
        color: 'text.secondary',
    },
    assigneeCell: {
        width: '40%',
        minWidth: 0,
    },
    note: {
        mt: 1.5,
    },
} satisfies SxStyles;

const getIds = (rows: OrgUnitRow[]): number[] => rows.map(row => row.id);

type Props = {
    assignee: TeamMember;
    assigneeRef: AssigneeRef;
    onClose: () => void;
};

// Checked org units end up assigned to the member: its own and the unassigned ones start checked.
// Selecting with a filter only affects the rows shown.
export const BulkAssignDialog: FC<Props> = ({
    assignee,
    assigneeRef,
    onClose,
}) => {
    const { formatMessage } = useSafeIntl();
    const { planning, selectedTeam } = useAssignmentsContext();
    const { rows: levelRows } = useLevelOrgUnitRows();
    const {
        assignments,
        assignableOrgUnitIds,
        orgUnitIdsWithAssignmentsBelow,
    } = useAssignableOrgUnits();
    const updateAssignments = useUpdateAssignments(planning.id);
    const confirmPublishedChange = useConfirmPublishedChange();

    const rows = useMemo(
        () => levelRows.filter(row => assignableOrgUnitIds.has(row.id)),
        [levelRows, assignableOrgUnitIds],
    );
    const ownIds = useMemo(
        () =>
            new Set(
                getOrgUnitIdsAssignedTo(
                    assignments,
                    assigneeRef,
                    assignableOrgUnitIds,
                ),
            ),
        [assignments, assigneeRef, assignableOrgUnitIds],
    );
    const [selectedIds, setSelectedIds] = useState(
        () =>
            new Set([...ownIds, ...getIds(rows.filter(row => !row.assignee))]),
    );
    const uncheckedOwnIds = useMemo(
        () => [...ownIds].filter(id => !selectedIds.has(id)),
        [ownIds, selectedIds],
    );
    const [search, setSearch] = useState('');
    const visibleRows = useMemo(
        () => filterByName(rows, search),
        [rows, search],
    );

    const handleSearch = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
        [],
    );
    const toggle = useCallback(
        (orgUnitId: number) =>
            setSelectedIds(previous => {
                const next = new Set(previous);
                if (!next.delete(orgUnitId)) next.add(orgUnitId);
                return next;
            }),
        [],
    );
    const select = useCallback(
        (orgUnitIds: number[]) =>
            setSelectedIds(previous => new Set([...previous, ...orgUnitIds])),
        [],
    );
    const selectAll = useCallback(
        () => select(getIds(visibleRows)),
        [select, visibleRows],
    );
    const selectUnassigned = useCallback(
        () => select(getIds(visibleRows.filter(row => !row.assignee))),
        [select, visibleRows],
    );
    const unselectAll = useCallback(() => {
        const visibleIds = new Set(getIds(visibleRows));
        setSelectedIds(
            previous =>
                new Set([...previous].filter(id => !visibleIds.has(id))),
        );
    }, [visibleRows]);

    const clearedCount = useMemo(
        () =>
            countClearedByReassign(
                [...selectedIds],
                assignments,
                assigneeRef,
                orgUnitIdsWithAssignmentsBelow,
            ) +
            uncheckedOwnIds.filter(id => orgUnitIdsWithAssignmentsBelow.has(id))
                .length,
        [
            selectedIds,
            uncheckedOwnIds,
            assignments,
            assigneeRef,
            orgUnitIdsWithAssignmentsBelow,
        ],
    );

    const handleConfirm = useCallback(() => {
        const changes = [
            { orgUnitIds: [...selectedIds], assignee: assigneeRef },
            { orgUnitIds: uncheckedOwnIds },
        ];
        confirmPublishedChange(() => updateAssignments(changes));
        onClose();
    }, [
        selectedIds,
        uncheckedOwnIds,
        confirmPublishedChange,
        updateAssignments,
        assigneeRef,
        onClose,
    ]);

    return (
        <ConfirmCancelModal
            open
            maxWidth="md"
            id="bulk-assign"
            dataTestId="bulk-assign"
            titleMessage={formatMessage(MESSAGES.bulkAssignTitle, {
                team: selectedTeam.name,
            })}
            onClose={onClose}
            closeDialog={onClose}
            onCancel={onClose}
            onConfirm={handleConfirm}
            allowConfirm={selectedIds.size > 0 || uncheckedOwnIds.length > 0}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.assign}
        >
            <Stack direction="row" alignItems="center" sx={styles.assignee}>
                <ColorBadge
                    backgroundColor={assignee.color}
                    sx={styles.colorBadge}
                />
                <Typography fontWeight={500}>
                    {formatMessage(MESSAGES.bulkAssignTo, {
                        member: assignee.name,
                    })}
                </Typography>
            </Stack>
            <TextField
                size="small"
                fullWidth
                value={search}
                onChange={handleSearch}
                label={formatMessage(MESSAGES.filterByName)}
            />
            <Stack direction="row" sx={styles.actions}>
                <Button size="small" onClick={selectAll}>
                    {formatMessage(MESSAGES.selectAll)}
                </Button>
                <Button size="small" onClick={selectUnassigned}>
                    {formatMessage(MESSAGES.selectUnassigned)}
                </Button>
                <Button size="small" onClick={unselectAll}>
                    {formatMessage(MESSAGES.unselectAll)}
                </Button>
            </Stack>
            <List dense disablePadding sx={styles.list}>
                {visibleRows.map(row => (
                    <BulkAssignRow
                        key={row.id}
                        row={row}
                        isSelected={selectedIds.has(row.id)}
                        onToggle={toggle}
                    />
                ))}
                {!visibleRows.length && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={styles.note}
                        align="center"
                    >
                        {formatMessage(MESSAGES.noOrgUnitMatchesFilter)}
                    </Typography>
                )}
            </List>
            <Typography variant="body2" sx={styles.note}>
                {formatMessage(MESSAGES.bulkAssignSelected, {
                    count: `${selectedIds.size}`,
                })}
                {uncheckedOwnIds.length > 0 &&
                    ` ${formatMessage(MESSAGES.bulkAssignUnassigns, {
                        count: `${uncheckedOwnIds.length}`,
                        member: assignee.name,
                    })}`}
                {clearedCount > 0 &&
                    ` ${formatMessage(MESSAGES.bulkAssignClearsBelow, {
                        count: `${clearedCount}`,
                    })}`}
            </Typography>
        </ConfirmCancelModal>
    );
};

type RowProps = {
    row: OrgUnitRow;
    isSelected: boolean;
    onToggle: (orgUnitId: number) => void;
};

const BulkAssignRow: FC<RowProps> = ({ row, isSelected, onToggle }) => {
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => onToggle(row.id), [onToggle, row.id]);
    return (
        <ListItemButton onClick={handleClick} sx={styles.row}>
            <Checkbox size="small" checked={isSelected} tabIndex={-1} />
            <Box sx={styles.name}>
                <Typography variant="body2" noWrap>
                    {row.name}
                </Typography>
                {row.isOffMap && (
                    <Tooltip title={formatMessage(MESSAGES.notOnMap)}>
                        <LocationOffIcon sx={styles.offMapIcon} />
                    </Tooltip>
                )}
            </Box>
            <Box sx={styles.assigneeCell}>
                <AssigneeCell assignee={row.assignee} />
            </Box>
        </ListItemButton>
    );
};
