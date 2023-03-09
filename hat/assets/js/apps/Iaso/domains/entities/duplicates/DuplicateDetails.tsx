import {
    Box,
    Button,
    Divider,
    Grid,
    makeStyles,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@material-ui/core';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import classnames from 'classnames';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import TopBar from '../../../components/nav/TopBarComponent';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { TableWithDeepLink } from '../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../constants/urls';
import { useArrayState } from '../../../hooks/useArrayState';
import { useObjectState } from '../../../hooks/useObjectState';
import { redirectTo } from '../../../routing/actions';
import { DuplicatesStars } from './DuplicatesStars';
import { useDuplicationDetailsColumns } from './hooks/useDuplicationDetailsColumns';
import {
    useGetDuplicateDetails,
    useGetDuplicates,
} from './hooks/useGetDuplicates';
import MESSAGES from './messages';
import InputComponent from '../../../components/forms/InputComponent';
import { DuplicateInfos } from './DuplicateInfos';
import { useDuplicateInfos } from './hooks/useDuplicateInfos';

type Props = {
    params: { accountId?: string; entities: string };
};

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        diffCell: {
            '& td:has(.diff)': {
                backgroundColor: '#FFEB99',
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
            },
        },
        droppedCell: {
            '& td:has(.dropped)': {
                backgroundColor: theme.palette.error.background,
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
                color: 'rgba(0,0,0,0.6)',
            },
        },
        selectedCell: {
            '& td:has(.selected)': {
                backgroundColor: theme.palette.success.background,
                borderRight: `2px solid ${theme.palette.ligthGray.main}`,
                fontWeight: 'bold',
            },
        },
        table: {
            '& .MuiTable-root': {
                // border: `1px solid rgb(224, 224, 224)`,
                borderLeft: `1px solid rgb(224, 224, 224)`,
                borderRight: `1px solid rgb(224, 224, 224)`,
                borderBottom: `1px solid rgb(224, 224, 224)`,
                // marginBottom: theme.spacing(2),
                width: '100%',
            },
        },
        fullWidth: { width: '100%' },
    };
});

export const DuplicateDetails: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const [tableState, setTableState] = useArrayState([]);
    console.log('tableState', tableState);
    const [query, setQuery] = useObjectState();
    const [onlyShowUnmatched, setOnlyShowUnmatched] = useState<boolean>(false);
    const classes: Record<string, string> = useStyles();
    const { data: duplicatesInfos } = useGetDuplicates({
        params: { entities: params.entities },
    });

    console.log('dupe infos', duplicatesInfos);
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
                title={formatMessage(MESSAGES.duplicates)}
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
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Paper elevation={2} className={classes.fullWidth}>
                    <Grid container>
                        <Grid item xs={4}>
                            <Box pb={2} pt={2} pl={2}>
                                <InputComponent
                                    withMarginTop={false}
                                    type="checkbox"
                                    value={onlyShowUnmatched}
                                    keyValue="onlyShowUnmatched"
                                    onChange={(_key, value) => {
                                        setOnlyShowUnmatched(value);
                                    }}
                                    label={MESSAGES.showIgnored}
                                />
                            </Box>
                        </Grid>
                        <Grid container item xs={8} justifyContent="flex-end">
                            <Box
                                pb={2}
                                pt={2}
                                pr={2}
                                style={{
                                    display: 'inline-flex',
                                }}
                            >
                                <Box>
                                    <Button variant="contained" color="primary">
                                        Take values from A
                                    </Button>
                                </Box>
                                <Box ml={2}>
                                    <Button variant="contained" color="primary">
                                        Take values from B
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
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
