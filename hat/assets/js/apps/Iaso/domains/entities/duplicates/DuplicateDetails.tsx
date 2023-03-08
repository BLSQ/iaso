import {
    Box,
    Button,
    Divider,
    Grid,
    makeStyles,
    Paper,
    GridItemsAlignment,
} from '@material-ui/core';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import classNames from 'classnames';
import React, { FunctionComponent, useEffect } from 'react';
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
    };
});

export const DuplicateDetails: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const [tableState, setTableState] = useArrayState([]);
    const [query, setQuery] = useObjectState();
    console.log('query', query);
    const classes: Record<string, string> = useStyles();
    const { data: duplicatesInfos, isFetching: isFetchingInfos } =
        useGetDuplicates({ params: { entities: params.entities } });

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
    });
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
                className={classNames(
                    classes.diffCell,
                    classes.droppedCell,
                    classes.selectedCell,
                    classes.containerFullHeightNoTabPadded,
                )}
            >
                <Grid container>
                    <Grid item xs={12} md={4}>
                        <Box pb={4}>
                            <WidgetPaper
                                //  className={classes.infoPaper}
                                title="CACA PROUT"
                            >
                                <Box style={{ minHeight: '100px' }}>
                                    {!duplicatesInfos?.length && (
                                        <LoadingSpinner />
                                    )}
                                    <DuplicatesStars
                                        starCount={5}
                                        fullStars={
                                            duplicatesInfos?.[0].similarity_star
                                        }
                                    />
                                </Box>
                            </WidgetPaper>
                        </Box>
                    </Grid>
                    <Grid container item xs={12} md={8}>
                        <Grid
                            container
                            item
                            xs={12}
                            justifyContent="flex-end"
                            alignItems="flex-end"
                            spacing={2}
                        >
                            <Box pb={4}>
                                <Button color="primary" variant="outlined">
                                    Ignore
                                </Button>
                            </Box>
                            <Box ml={2} pb={4}>
                                <Button variant="contained" color="primary">
                                    Merge
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
                <Paper elevation={2}>
                    <Box padding={2}>
                        <Grid container justifyContent="flex-end">
                            <Box
                                pb={2}
                                style={{
                                    display: 'inline-flex',
                                }}
                            >
                                <Button variant="contained" color="primary">
                                    Take values from A
                                </Button>
                                <Box ml={2}>
                                    <Button variant="contained" color="primary">
                                        Take values from B
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        <Divider />
                        <TableWithDeepLink
                            showPagination={false}
                            baseUrl={baseUrls.entityDuplicateDetails}
                            columns={columns}
                            marginTop={false}
                            data={tableState}
                            // defaultSorted={}
                            params={params}
                            extraProps={{ loading: isFetching }}
                            onTableParamsChange={p =>
                                dispatch(
                                    redirectTo(
                                        baseUrls.entityDuplicateDetails,
                                        p,
                                    ),
                                )
                            }
                        />
                    </Box>
                </Paper>
            </Box>
        </>
    );
};
