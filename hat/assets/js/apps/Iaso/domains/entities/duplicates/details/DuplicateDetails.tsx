import { Box, Divider, Grid, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { isEqual } from 'lodash';
import TopBar from '../../../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { useArrayState } from '../../../../hooks/useArrayState';
import { useObjectState } from '../../../../hooks/useObjectState';
import { redirectTo } from '../../../../routing/actions';
import { useDuplicationDetailsColumns } from './hooks/useDuplicationDetailsColumns';
import {
    useGetDuplicateDetails,
    useGetDuplicates,
} from '../hooks/api/useGetDuplicates';
import MESSAGES from '../messages';
import { DuplicateInfos } from './DuplicateInfos';
import { useDuplicateInfos } from './hooks/useDuplicateInfos';
import { DuplicateData, DuplicateEntityForTable } from '../types';
import { useGoBack } from '../../../../routing/useGoBack';
import { Router } from '../../../../types/general';
import { DuplicateDetailsTableButtons } from './DuplicateDetailsTableButtons';
import { SubmissionsForEntity } from './submissions/SubmissionsForEntity';

const updateCellColors =
    (selected: 'entity1' | 'entity2') =>
    (row: DuplicateEntityForTable): DuplicateEntityForTable => {
        const dropped = selected === 'entity1' ? 'entity2' : 'entity1';
        if (row.entity1.status === 'identical') return row;
        return {
            ...row,
            [selected]: { ...row[selected], status: 'selected' },
            final: {
                ...row.final,
                status: 'selected',
                value: row[selected].value,
            },
            [dropped]: { ...row[dropped], status: 'dropped' },
        };
    };

const resetCellColors = (
    row: DuplicateEntityForTable,
): DuplicateEntityForTable => {
    if (row.entity1.status === 'identical') return row;
    return {
        ...row,
        entity1: { ...row.entity1, status: 'diff' },
        entity2: { ...row.entity2, status: 'diff' },
        final: { ...row.final, status: 'dropped', value: '' },
    };
};

type Props = {
    params: { accountId?: string; entities: string };
    router: Router;
};

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        table: {
            '& .MuiTable-root': {
                borderLeft: `1px solid rgb(224, 224, 224)`,
                borderRight: `1px solid rgb(224, 224, 224)`,
                borderBottom: `1px solid rgb(224, 224, 224)`,
                width: '100%',
            },
        },
        fullWidth: { width: '100%' },
        hidden: { visibility: 'collapse' },
        diff: {
            backgroundColor: '#FFEB99',
            // @ts-ignore
            borderRight: `2px solid ${theme.palette.ligthGray.main}`,
        },
        dropped: {
            // @ts-ignore
            backgroundColor: theme.palette.error.background,
            // @ts-ignore
            borderRight: `2px solid ${theme.palette.ligthGray.main}`,
            color: 'rgba(0,0,0,0.6)',
        },
        selected: {
            // @ts-ignore
            backgroundColor: theme.palette.success.background,
            // @ts-ignore
            borderRight: `2px solid ${theme.palette.ligthGray.main}`,
            fontWeight: 'bold',
        },
        pointer: { cursor: 'pointer' },
    };
});

export const DuplicateDetails: FunctionComponent<Props> = ({
    router,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [tableState, setTableState] = useArrayState([]);
    const [unfilteredTableState, setUnfilteredTableState] = useArrayState([]);
    const [query, setQuery] = useObjectState();
    const [onlyShowUnmatched, setOnlyShowUnmatched] = useState<boolean>(false);
    const classes: Record<string, string> = useStyles();
    const goBack = useGoBack(router, baseUrls.entityDuplicates);
    const { data: duplicatesInfos } = useGetDuplicates({
        params: { entities: params.entities },
    }) as { data: { results: DuplicateData[] } };

    const [entityIdA, entityIdB] = params.entities.split(',');

    const disableMerge = Boolean(
        tableState.find(row => row.final.status === 'dropped'),
    );

    const { data: dupDetailData, isFetching } = useGetDuplicateDetails({
        params,
    });

    const { fields: entities, descriptor1, descriptor2 } = dupDetailData || {};
    const descriptors = useMemo(() => {
        return { descriptor1, descriptor2 };
    }, [descriptor1, descriptor2]);

    const {
        unmatchedRemaining,
        formName,
        algorithmRuns,
        algorithmsUsed,
        similarityScore,
        isLoading: isLoadingInfos,
        entityIds,
    } = useDuplicateInfos({ tableState, duplicatesInfos, params });

    const updateCellState = useCallback(
        (index, newValues) => {
            setTableState({
                index,
                value: newValues,
            });
            const unfilteredIndex = unfilteredTableState.findIndex(row =>
                isEqual(row.field, newValues.field),
            );

            setUnfilteredTableState({
                index: unfilteredIndex,
                value: newValues,
            });
        },
        [setTableState, setUnfilteredTableState, unfilteredTableState],
    );

    const columns = useDuplicationDetailsColumns({
        state: tableState,
        updateCellState,
        setQuery,
        descriptors,
    });

    const takeAllValuesFromEntity = useCallback(
        (entity: 'entity1' | 'entity2') => {
            const selected = entity;
            const newState = [...tableState].map(updateCellColors(entity));
            const newUnfilteredState = [...unfilteredTableState].map(
                updateCellColors(entity),
            );
            const newQuery = {};
            newState.forEach(row => {
                if (row.entity1.status !== 'identical') {
                    newQuery[row.field.field] = row[selected].id;
                }
            });
            setTableState({ index: 'all', value: newState });
            setUnfilteredTableState({
                index: 'all',
                value: newUnfilteredState,
            });
            setQuery(newQuery);
        },
        [
            setQuery,
            setTableState,
            setUnfilteredTableState,
            tableState,
            unfilteredTableState,
        ],
    );

    const resetSelection = useCallback(() => {
        const newState = [...tableState].map(resetCellColors);
        const newUnfilteredState = [...unfilteredTableState].map(
            resetCellColors,
        );
        setTableState({ index: 'all', value: newState });
        setUnfilteredTableState({
            index: 'all',
            value: newUnfilteredState,
        });
        setQuery({});
    }, [
        setQuery,
        setTableState,
        setUnfilteredTableState,
        tableState,
        unfilteredTableState,
    ]);

    const toggleUnmatchedDisplay = useCallback(
        (value: boolean) => {
            setOnlyShowUnmatched(value);
            if (value) {
                const filtered = tableState.filter(
                    item => item.entity1.status !== 'identical',
                );
                setTableState({ index: 'all', value: filtered });
            }
            if (!value) {
                setTableState({ index: 'all', value: unfilteredTableState });
            }
        },
        [setTableState, tableState, unfilteredTableState],
    );

    const getRowProps = useCallback(
        row => {
            if (
                row.original.entity1.status === 'identical' &&
                row.original.entity2.status === 'identical' &&
                row.original.final.status === 'identical' &&
                onlyShowUnmatched
            ) {
                return {
                    className: `${classes.hidden}`,
                    'data-test': 'hidden-row',
                };
            }
            return {
                'data-test': 'visible-row',
            };
        },
        [classes.hidden, onlyShowUnmatched],
    );

    const getCellProps = useCallback(
        cell => {
            if (cell.column.id === 'final') {
                return { className: classes[cell.value.status] };
            }
            return {
                className: classnames(
                    classes[cell.value.status],
                    classes.pointer,
                ),
                'data-test': cell.value.status,
            };
        },
        [classes],
    );

    useEffect(() => {
        if (tableState.length === 0 && entities) {
            setTableState({ index: 'all', value: entities });
            setUnfilteredTableState({ index: 'all', value: entities });
        }
    }, [entities, setTableState, setUnfilteredTableState, tableState.length]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.compareDuplicates)}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box
                className={classnames(
                    classes.diffCell,
                    classes.droppedCell,
                    classes.selectedCell,
                    classes.containerFullHeightNoTabPadded,
                )}
            >
                <Grid container>
                    <Grid item xs={12}>
                        <Box pb={4}>
                            <DuplicateInfos
                                unmatchedRemaining={unmatchedRemaining}
                                formName={formName}
                                algorithmRuns={algorithmRuns}
                                algorithmsUsed={algorithmsUsed}
                                similarityScore={similarityScore}
                                isLoading={isLoadingInfos}
                                entityIds={entityIds}
                                query={query}
                                disableMerge={disableMerge}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Box data-test="duplicate-table">
                    <Paper elevation={2} className={classes.fullWidth}>
                        <DuplicateDetailsTableButtons
                            onlyShowUnmatched={onlyShowUnmatched}
                            setOnlyShowUnmatched={toggleUnmatchedDisplay}
                            fillValues={takeAllValuesFromEntity}
                            resetSelection={resetSelection}
                        />
                        <Divider />
                        <TableWithDeepLink
                            showPagination={false}
                            baseUrl={baseUrls.entityDuplicateDetails}
                            columns={columns}
                            marginTop={false}
                            countOnTop={false}
                            elevation={0}
                            data={tableState}
                            rowProps={getRowProps}
                            cellProps={getCellProps}
                            params={params}
                            extraProps={{
                                loading: isFetching,
                                onlyShowUnmatched,
                                entities,
                                getRowProps,
                            }}
                            onTableParamsChange={p =>
                                dispatch(
                                    redirectTo(
                                        baseUrls.entityDuplicateDetails,
                                        p,
                                    ),
                                )
                            }
                        />
                    </Paper>
                </Box>
                <Box>
                    <Grid container item spacing={2}>
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            data-test="duplicate-submissions-a"
                        >
                            <SubmissionsForEntity
                                entityId={entityIdA}
                                title={formatMessage(
                                    MESSAGES.submissionsForEntity,
                                    { entity: 'A' },
                                )}
                            />
                        </Grid>
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            data-test="duplicate-submissions-b"
                        >
                            <SubmissionsForEntity
                                entityId={entityIdB}
                                title={formatMessage(
                                    MESSAGES.submissionsForEntity,
                                    { entity: 'B' },
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
