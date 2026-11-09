import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { useAssignments } from '../mainPanel/useAssignments';
import { getAssigneeByOrgUnitId } from '../mainPanel/utils';
import { FindOrgUnitTreeRow } from './FindOrgUnitTreeRow';
import { useFindOrgUnits } from './usePlanningOrgUnitTree';
import { flattenFindOrgUnitRows, getOrgUnitChain } from './utils';

// Keeps a broad search responsive on large plannings.
const MAX_ROWS = 200;

const styles = {
    list: {
        position: 'relative',
        height: 380,
        overflowY: 'auto',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        py: 0.5,
    },
    message: {
        p: 3,
        textAlign: 'center',
    },
} satisfies SxStyles;

const toggleId = (ids: Set<number>, id: number): Set<number> => {
    const next = new Set(ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
};

type Props = {
    // The org unit found last, whose branch starts expanded.
    initialSelectedId?: number;
    selectedId?: number;
    onSelect: (orgUnitId: number) => void;
};

export const FindOrgUnitTree: FC<Props> = ({
    initialSelectedId,
    selectedId,
    onSelect,
}) => {
    const { formatMessage } = useSafeIntl();
    const { planning, tree } = useAssignmentsContext();
    const { data: assignments } = useAssignments(`${planning.id}`);
    const [search, setSearch] = useState('');
    // Expanded or collapsed by hand, against the default of the roots and the selected branch.
    const [toggledIds, setToggledIds] = useState<Set<number>>(new Set());
    const orgUnits = useFindOrgUnits();

    const expandedIds = useMemo(() => {
        if (!orgUnits) return new Set<number>();
        const selectedAncestors = initialSelectedId
            ? getOrgUnitChain(orgUnits.orgUnitById, initialSelectedId).slice(
                  0,
                  -1,
              )
            : [];
        const defaultIds = new Set(
            [...orgUnits.roots, ...selectedAncestors].map(({ id }) => id),
        );
        return new Set(
            [...defaultIds, ...toggledIds].filter(
                id => defaultIds.has(id) !== toggledIds.has(id),
            ),
        );
    }, [orgUnits, initialSelectedId, toggledIds]);

    const assigneeByOrgUnitId = useMemo(
        () => getAssigneeByOrgUnitId(tree, assignments ?? []),
        [tree, assignments],
    );
    // The planning root is the area of the root team.
    const rootAssignee = useMemo(
        () => ({ name: tree.name, color: tree.color }),
        [tree.name, tree.color],
    );
    const rows = useMemo(
        () =>
            orgUnits
                ? flattenFindOrgUnitRows(orgUnits, expandedIds, search)
                : [],
        [orgUnits, expandedIds, search],
    );

    const handleSearchChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
        [],
    );
    const handleToggle = useCallback(
        (orgUnitId: number) =>
            setToggledIds(previous => toggleId(previous, orgUnitId)),
        [],
    );
    const isLoadingFullTree = !orgUnits?.isFullTree;

    return (
        <>
            <TextField
                value={search}
                onChange={handleSearchChange}
                placeholder={formatMessage(MESSAGES.searchByName)}
                helperText={
                    search && isLoadingFullTree
                        ? formatMessage(MESSAGES.loadingAllOrgUnits)
                        : ''
                }
                size="small"
                fullWidth
                autoFocus
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />
            <Typography variant="caption" color="text.secondary">
                {formatMessage(MESSAGES.findOrgUnitCaption)}
            </Typography>
            <Box sx={styles.list} role="listbox">
                {!orgUnits && <LoadingSpinner absolute fixed={false} />}
                {rows.slice(0, MAX_ROWS).map(row => (
                    <FindOrgUnitTreeRow
                        key={row.orgUnit.id}
                        row={row}
                        assignee={
                            row.depth === 0
                                ? rootAssignee
                                : assigneeByOrgUnitId.get(row.orgUnit.id)
                        }
                        isSelected={row.orgUnit.id === selectedId}
                        onSelect={onSelect}
                        onToggle={handleToggle}
                    />
                ))}
                {rows.length > MAX_ROWS && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={styles.message}
                    >
                        {formatMessage(
                            MESSAGES.findOrgUnitTooManyRows,
                            numericValues({ count: MAX_ROWS }),
                        )}
                    </Typography>
                )}
                {orgUnits && rows.length === 0 && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={styles.message}
                    >
                        {formatMessage(MESSAGES.noOrgUnitMatchesSearch)}
                    </Typography>
                )}
            </Box>
        </>
    );
};
