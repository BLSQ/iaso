import React, {
    FunctionComponent,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { cloneDeep, sortBy } from 'lodash';
import {
    TableContainer,
    Table as MuiTable,
    TableCell,
    TableBody,
    TablePagination,
    TableRow,
    TableHead,
    Box,
    Typography,
    makeStyles,
} from '@material-ui/core';
import MapIcon from '@material-ui/icons/Map';
import { FAIL_COLOR, OK_COLOR } from '../../../../../styles/constants';
import MESSAGES from '../../../../../constants/messages';
import { useStyles } from '../../../../../styles/theme';
import { TableText } from '../../../../Campaigns/Scope/Scopes/TableText';
import { TablePlaceHolder } from '../../../../Campaigns/Scope/Scopes/TablePlaceHolder';
import { Router } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { AfroMapParams, Side } from '../types';
import {
    useAfroMapShapes,
    useGetZoomedInShapes,
} from '../hooks/useAfroMapShapes';
import { getRound } from '../utils';
import { LqasAfroOverviewContext } from '../Context/LqasAfroOverviewContext';
import { HasLocationIcon } from './HasLocationIcon';
import { IN_SCOPE, LQAS_FAIL, LQAS_PASS } from '../../../shared/constants';

type SortFocus =
    | 'DISTRICT'
    | 'REGION'
    | 'STATUS'
    | 'COUNTRY'
    | 'CAMPAIGN'
    | 'LOCATION'
    | 'ROUND';

type Props = {
    router: Router;
    side: Side;
};

const useTableStyle = makeStyles(theme => {
    return {
        districtList: {
            overflow: 'auto',
            height: 'auto',
            maxHeight: '60vh',
            '& thead tr th': {
                // @ts-ignore
                boxShadow: `2px 2px ${theme.palette.ligthGray.main}`,
            },
            '& tbody tr:hover': {
                backgroundColor: theme.palette.action.hover,
            },
        },
        [LQAS_PASS]: { color: OK_COLOR },
        [LQAS_FAIL]: { color: FAIL_COLOR },
    };
});

export const LqasAfroList: FunctionComponent<Props> = ({ router, side }) => {
    const classes: Record<string, string> = useStyles();
    const tableClasses: Record<string, string> = useTableStyle();
    const { bounds } = useContext(LqasAfroOverviewContext);
    const { formatMessage } = useSafeIntl();
    const currentView =
        side === 'left'
            ? router.params.displayedShapesLeft
            : router.params.displayedShapesRight;

    const showCountries = currentView !== 'district';
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState<SortFocus>('COUNTRY');
    const [page, setPage] = useState<number>(0);
    const selectedRound = getRound(router.params.rounds, side);

    const { data: countryShapes, isFetching: isFetchingCountries } =
        useAfroMapShapes({
            category: 'lqas',
            enabled: showCountries,
            params: router.params as AfroMapParams,
            selectedRound,
            side,
        });

    const { data: districtShapes, isFetching: isFetchingDistricts } =
        useGetZoomedInShapes({
            bounds: JSON.stringify(bounds),
            category: 'lqas',
            enabled: !showCountries && Boolean(bounds),
            params: router.params as AfroMapParams,
            selectedRound,
            side,
        });

    const shapesToDisplay = useMemo(() => {
        return showCountries ? countryShapes : districtShapes;
    }, [countryShapes, districtShapes, showCountries]);

    const handleSort = useCallback(
        columnToSortBy => {
            if (sortFocus !== columnToSortBy) {
                setSortFocus(columnToSortBy);
            } else if (orderBy === 'asc') {
                setOrderBy('desc');
            } else {
                setOrderBy('asc');
            }
        },
        [orderBy, sortFocus],
    );

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const shapesForTable = useMemo(() => {
        if (!shapesToDisplay) {
            return null;
        }
        let result = cloneDeep(shapesToDisplay);

        if (sortFocus === 'REGION') {
            result = sortBy(result, ['data.region_name']);
        } else if (sortFocus === 'COUNTRY') {
            result = sortBy(result, ['country_name']);
        } else if (sortFocus === 'DISTRICT') {
            result = sortBy(result, ['data.district_name']);
        } else if (sortFocus === 'STATUS') {
            result = sortBy(result, ['status']);
        } else if (sortFocus === 'ROUND') {
            result = sortBy(result, ['data.round_number']);
        } else if (sortFocus === 'CAMPAIGN') {
            result = sortBy(result, ['data.campaign']);
        } else if (sortFocus === 'LOCATION') {
            result = sortBy(result, ['data.geo_json']);
        }
        if (orderBy === 'desc') {
            result = result.reverse();
        }
        result = result.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage,
        );
        result = result.map(shape => ({
            ...shape,
        }));
        return result;
    }, [shapesToDisplay, sortFocus, orderBy, page, rowsPerPage]);

    const displayPlaceHolder =
        isFetchingDistricts ||
        isFetchingCountries ||
        ((districtShapes ?? []).length === 0 && !showCountries) ||
        ((countryShapes ?? []).length === 0 && showCountries);

    return (
        <Box>
            <TableContainer className={tableClasses.districtList}>
                <MuiTable stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell
                                onClick={() => handleSort('COUNTRY')}
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.country)}
                                </Typography>
                            </TableCell>
                            {!showCountries && (
                                <>
                                    <TableCell
                                        onClick={() => handleSort('REGION')}
                                        variant="head"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Typography>
                                            {formatMessage(MESSAGES.region)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell
                                        onClick={() => handleSort('DISTRICT')}
                                        variant="head"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Typography>
                                            {formatMessage(MESSAGES.district)}
                                        </Typography>
                                    </TableCell>
                                </>
                            )}
                            <TableCell
                                onClick={() => handleSort('CAMPAIGN')}
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.campaign)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                onClick={() => handleSort('ROUND')}
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.round)}
                                </Typography>
                            </TableCell>
                            <TableCell
                                onClick={() => handleSort('STATUS')}
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.status)}
                                </Typography>
                            </TableCell>
                            {!showCountries && (
                                <TableCell
                                    onClick={() => handleSort('LOCATION')}
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        width: '70px',
                                    }}
                                >
                                    <Box
                                        top="4px"
                                        position="relative"
                                        left="-3px"
                                    >
                                        <MapIcon
                                            fontSize="small"
                                            color="inherit"
                                        />
                                    </Box>
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayPlaceHolder && (
                            <TablePlaceHolder
                                isFetching={
                                    isFetchingDistricts || isFetchingCountries
                                }
                                filteredDistricts={[]}
                            />
                        )}
                        {!displayPlaceHolder &&
                            shapesForTable?.map((shape, i) => {
                                return (
                                    <TableRow
                                        key={shape.id}
                                        className={
                                            i % 2 > 0
                                                ? classes.districtListRow
                                                : ''
                                        }
                                    >
                                        <TableCell>
                                            <TableText
                                                text={
                                                    (showCountries
                                                        ? shape.data
                                                              .country_name
                                                        : shape.country_name) ||
                                                    -''
                                                }
                                            />
                                        </TableCell>
                                        {!showCountries && (
                                            <>
                                                <TableCell>
                                                    <TableText
                                                        text={
                                                            shape.data
                                                                .region_name ||
                                                            '-'
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TableText
                                                        text={
                                                            shape.data
                                                                .district_name ||
                                                            '-'
                                                        }
                                                    />
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell>
                                            <TableText
                                                text={
                                                    shape.data.campaign || '-'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableText
                                                text={
                                                    shape.data.round_number ||
                                                    '-'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                className={
                                                    shape.status &&
                                                    shape.status !== IN_SCOPE
                                                        ? tableClasses[
                                                              shape.status
                                                          ]
                                                        : ''
                                                }
                                                variant="body2"
                                            >
                                                {formatMessage(
                                                    MESSAGES[shape.status],
                                                ) ||
                                                    formatMessage(
                                                        MESSAGES.noDataFound,
                                                    )}
                                            </Typography>
                                        </TableCell>
                                        {!showCountries && (
                                            <TableCell>
                                                <HasLocationIcon
                                                    shape={shape}
                                                />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </MuiTable>
            </TableContainer>
            <TablePagination
                className={classes.tablePagination}
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={shapesToDisplay?.length ?? 0}
                rowsPerPage={rowsPerPage}
                page={page}
                labelRowsPerPage="Rows"
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
};
