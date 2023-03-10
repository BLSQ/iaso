import { Box, Divider, Grid, makeStyles, Paper } from '@material-ui/core';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import TopBar from '../../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { useArrayState } from '../../../hooks/useArrayState';
import { useObjectState } from '../../../hooks/useObjectState';
import { redirectTo } from '../../../routing/actions';
import { useDuplicationDetailsColumns } from './hooks/useDuplicationDetailsColumns';
import {
    useGetDuplicateDetails,
    useGetDuplicates,
} from './hooks/useGetDuplicates';
import MESSAGES from './messages';
import { DuplicateInfos } from './DuplicateInfos';
import { useDuplicateInfos } from './hooks/useDuplicateInfos';
import { DuplicateDetailsTableButtons } from './DuplicateDetailsTableButtons';
import { DuplicateData } from './types';

type Props = {
    params: { accountId?: string; entities: string };
};

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        diffCell: {
            '& td:has(.diff)': {
                backgroundColor: '#FFEB99',
                // @ts-ignore
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
            },
        },
        droppedCell: {
            '& td:has(.dropped)': {
                // @ts-ignore
                backgroundColor: theme.palette.error.background,
                // @ts-ignore
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
                color: 'rgba(0,0,0,0.6)',
            },
        },
        selectedCell: {
            '& td:has(.selected)': {
                // @ts-ignore
                backgroundColor: theme.palette.success.background,
                // @ts-ignore
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
                fontWeight: 'bold',
            },
        },
        table: {
            '& .MuiTable-root': {
                borderLeft: `1px solid rgb(224, 224, 224)`,
                borderRight: `1px solid rgb(224, 224, 224)`,
                borderBottom: `1px solid rgb(224, 224, 224)`,
                width: '100%',
            },
        },
        fullWidth: { width: '100%' },
    };
});

export const DuplicateDetails: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const [tableState, setTableState] = useArrayState([]);
    const [query, setQuery] = useObjectState();
    const [onlyShowUnmatched, setOnlyShowUnmatched] = useState<boolean>(false);
    const classes: Record<string, string> = useStyles();
    const { data: duplicatesInfos } = useGetDuplicates({
        params: { entities: params.entities },
    }) as { data: DuplicateData[] };

    // TODO params as array, since comma is modified
    const { data: entities, isFetching } = useGetDuplicateDetails({
        params,
    });
    const dispatch = useDispatch();
    const columns = useDuplicationDetailsColumns({
        state: tableState,
        setState: setTableState,
        setQuery,
        onlyShowUnmatched,
    });
    const {
        unmatchedRemaining,
        formName,
        algorithmRuns,
        algorithmsUsed,
        similarityScore,
        isLoading: isLoadingInfos,
        entityIds,
    } = useDuplicateInfos({ tableState, duplicatesInfos, params });

    useEffect(() => {
        if (tableState.length === 0 && entities) {
            setTableState({ index: 'all', value: entities });
        }
    }, [entities, setTableState, tableState.length]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.compareDuplicates)}
                displayBackButton
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
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Paper elevation={2} className={classes.fullWidth}>
                    <DuplicateDetailsTableButtons
                        onlyShowUnmatched={onlyShowUnmatched}
                        setOnlyShowUnmatched={setOnlyShowUnmatched}
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
                        // defaultSorted={}
                        params={params}
                        extraProps={{
                            loading: isFetching,
                            onlyShowUnmatched,
                        }}
                        onTableParamsChange={p =>
                            dispatch(
                                redirectTo(baseUrls.entityDuplicateDetails, p),
                            )
                        }
                    />
                </Paper>
            </Box>
        </>
    );
};
