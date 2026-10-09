import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Checkbox,
    IconButton,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { debounce, noop } from 'lodash';
import {
    MissionPolymorphicList,
    useApiMicroplanningMissionsList,
} from 'Iaso/api/missions';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { MissionTypeCaption } from 'Iaso/domains/missions/components/chips/MissionTypeCaption';
import MISSION_MESSAGES from 'Iaso/domains/missions/messages';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../contexts/PlanningContext';
import MESSAGES from '../messages';

const SEARCH_DEBOUNCE_MS = 300;
const ROWS_PER_PAGE = 8;

const styles = {
    search: {
        mb: 2,
    },
    tableContainer: {
        position: 'relative',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
    },
    headerCell: {
        fontWeight: 'bold',
    },
    row: {
        cursor: 'pointer',
    },
    disabledRow: {
        cursor: 'default',
    },
    tableBody: {
        '& tr:last-child td': {
            borderBottom: 0,
        },
    },
} satisfies SxStyles;

type MissionRowProps = {
    mission: MissionPolymorphicList;
    isLinked: boolean;
    isSelected: boolean;
    onToggle: (missionId: number) => void;
};

const MissionRow: FC<MissionRowProps> = ({
    mission,
    isLinked,
    isSelected,
    onToggle,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => {
        if (!isLinked) {
            onToggle(mission.id);
        }
    }, [isLinked, onToggle, mission.id]);
    return (
        <TableRow
            hover={!isLinked}
            onClick={handleClick}
            sx={isLinked ? styles.disabledRow : styles.row}
        >
            <TableCell padding="checkbox">
                <Checkbox
                    checked={isLinked || isSelected}
                    disabled={isLinked}
                />
            </TableCell>
            <TableCell>
                <Typography
                    variant="body2"
                    color={isLinked ? 'text.disabled' : 'text.primary'}
                >
                    {mission.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {isLinked
                        ? formatMessage(MESSAGES.alreadyLinked)
                        : formatMessage(
                              MISSION_MESSAGES.formsCount,
                              numericValues({ count: mission.forms_count }),
                          )}
                </Typography>
            </TableCell>
            <TableCell>
                <MissionTypeCaption missionType={mission.mission_type} />
            </TableCell>
        </TableRow>
    );
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const AddMissionsDialog: FC<Props> = ({ isOpen, closeDialog }) => {
    const { formatMessage } = useSafeIntl();
    const { formik, addMissions } = usePlanningContext();
    const linkedMissionIds = formik.values.missions;

    const [search, setSearch] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');
    const [page, setPage] = useState<number>(0);
    const [selectedMissionIds, setSelectedMissionIds] = useState<number[]>([]);

    const applySearch = useMemo(
        () =>
            debounce((value: string) => {
                setDebouncedSearch(value);
                setPage(0);
            }, SEARCH_DEBOUNCE_MS),
        [],
    );
    useEffect(() => () => applySearch.cancel(), [applySearch]);

    const handleSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(event.target.value);
            applySearch(event.target.value);
        },
        [applySearch],
    );

    const handlePageChange = useCallback(
        (_event: unknown, newPage: number) => setPage(newPage),
        [],
    );

    const { data, isFetching } = useApiMicroplanningMissionsList(
        {
            search: debouncedSearch || undefined,
            page: page + 1,
            limit: ROWS_PER_PAGE,
        },
        { query: { keepPreviousData: true } },
    );
    const missions = data?.results ?? [];

    const toggleMission = useCallback((missionId: number) => {
        setSelectedMissionIds(previous =>
            previous.includes(missionId)
                ? previous.filter(id => id !== missionId)
                : [...previous, missionId],
        );
    }, []);

    const handleConfirm = useCallback(
        () => addMissions(selectedMissionIds),
        [addMissions, selectedMissionIds],
    );

    return (
        <ConfirmCancelModal
            id="add-missions-dialog"
            dataTestId="add-missions-dialog"
            open={isOpen}
            closeDialog={closeDialog}
            onClose={noop}
            onCancel={noop}
            onConfirm={handleConfirm}
            allowConfirm={selectedMissionIds.length > 0}
            titleMessage={formatMessage(MESSAGES.addMissionsToPlanning)}
            confirmMessage={MESSAGES.linkMission}
            cancelMessage={MESSAGES.cancel}
        >
            <TextField
                fullWidth
                size="small"
                value={search}
                onChange={handleSearchChange}
                placeholder={formatMessage(MESSAGES.searchMission)}
                sx={styles.search}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />
            <Box sx={styles.tableContainer}>
                {isFetching && <LoadingSpinner absolute fixed={false} />}
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell sx={styles.headerCell}>
                                {formatMessage(MESSAGES.name)}
                            </TableCell>
                            <TableCell sx={styles.headerCell}>
                                {formatMessage(MESSAGES.type)}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody sx={styles.tableBody}>
                        {missions.map(mission => (
                            <MissionRow
                                key={mission.id}
                                mission={mission}
                                isLinked={
                                    linkedMissionIds?.includes(mission.id) ??
                                    false
                                }
                                isSelected={selectedMissionIds.includes(
                                    mission.id,
                                )}
                                onToggle={toggleMission}
                            />
                        ))}
                        {!isFetching && missions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatMessage(
                                            MISSION_MESSAGES.noResultsFound,
                                        )}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Box>
            <TablePagination
                component="div"
                count={data?.count ?? 0}
                page={page}
                rowsPerPage={ROWS_PER_PAGE}
                rowsPerPageOptions={[]}
                onPageChange={handlePageChange}
            />
        </ConfirmCancelModal>
    );
};

type AddMissionsButtonProps = {
    onClick: () => void;
};

const AddMissionsButton: FC<AddMissionsButtonProps> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip title={formatMessage(MESSAGES.addMissions)}>
            <IconButton color="primary" onClick={onClick}>
                <PlaylistAddIcon />
            </IconButton>
        </Tooltip>
    );
};

const addMissionsDialog = makeFullModal(AddMissionsDialog, AddMissionsButton);

export { addMissionsDialog as AddMissionsDialog };
