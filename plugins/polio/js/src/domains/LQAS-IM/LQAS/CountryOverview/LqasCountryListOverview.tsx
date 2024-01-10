import React, {
    FunctionComponent,
    useCallback,
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
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import MapIcon from '@mui/icons-material/Map';
import { OK_COLOR, FAIL_COLOR } from '../../../../styles/constants';
import { LQAS_PASS, LQAS_FAIL } from '../constants';
import { useStyles } from '../../../../styles/theme';
import MESSAGES from '../../../../constants/messages';
import { TablePlaceHolder } from '../../../Campaigns/Scope/Scopes/TablePlaceHolder';
import { TableText } from '../../../Campaigns/Scope/Scopes/TableText';
import { IN_SCOPE } from '../../shared/constants';
import { HasLocationIcon } from '../LqasAfroOverview/ListView/HasLocationIcon';
import { findRegionShape } from '../utils';

type SortFocus =
    | 'DISTRICT'
    | 'REGION'
    | 'STATUS'
    | 'COUNTRY'
    | 'CAMPAIGN'
    | 'LOCATION'
    | 'ROUND';

type Props = {
    shapes: any;
    isFetching: boolean;
    regionShapes: any;
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

export const LqasCountryListOverview: FunctionComponent<Props> = ({
    shapes,
    isFetching,
    regionShapes,
}) => {
    const classes: Record<string, string> = useStyles();
    const tableClasses: Record<string, string> = useTableStyle();
    const { formatMessage } = useSafeIntl();

    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [orderBy, setOrderBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState<SortFocus>('REGION');
    const [page, setPage] = useState<number>(0);

    const shapesWithRegionName = useMemo(() => {
        if (!shapes) return null;
        return shapes.map(shape => {
            const copy = { ...shape };
            if (!shape?.data?.region_name) {
                copy.data = {};
                copy.data.region_name = findRegionShape(shape, regionShapes);
            }
            return copy;
        });
    }, [regionShapes, shapes]);

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
        if (!shapesWithRegionName) {
            return null;
        }
        let result = cloneDeep(shapesWithRegionName);

        if (sortFocus === 'REGION') {
            result = sortBy(result, ['data.region_name']);
        } else if (sortFocus === 'COUNTRY') {
            result = sortBy(result, ['country_name']);
        } else if (sortFocus === 'DISTRICT') {
            result = sortBy(result, ['name']);
        } else if (sortFocus === 'STATUS') {
            result = sortBy(result, ['status']);
        } else if (sortFocus === 'LOCATION') {
            result = sortBy(result, ['has_geo_json']);
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
    }, [shapesWithRegionName, sortFocus, orderBy, page, rowsPerPage]);

    const displayPlaceHolder = isFetching;

    return (
        <Box>
            {shapes && (
                <TableContainer className={tableClasses.districtList}>
                    <MuiTable stickyHeader size="small">
                        <TableHead>
                            <TableRow>
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
                                <TableCell variant="head">
                                    <Typography>
                                        {formatMessage(MESSAGES.result)}
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayPlaceHolder && (
                                <TablePlaceHolder
                                    isFetching={isFetching}
                                    filteredDistricts={shapes}
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
                                                        shape?.data
                                                            ?.region_name || '-'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TableText
                                                    text={shape.name || '-'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {`${
                                                        shape?.data
                                                            ?.total_child_fmd ??
                                                        '--'
                                                    }/${
                                                        shape?.data
                                                            ?.total_child_checked ??
                                                        '--'
                                                    }`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    className={
                                                        shape.status &&
                                                        shape.status !==
                                                            IN_SCOPE
                                                            ? tableClasses[
                                                                  shape.status
                                                              ]
                                                            : ''
                                                    }
                                                    variant="body2"
                                                >
                                                    {(shape?.data?.status &&
                                                        formatMessage(
                                                            MESSAGES[
                                                                shape?.data
                                                                    ?.status
                                                            ],
                                                        )) ||
                                                        formatMessage(
                                                            MESSAGES.noDataFound,
                                                        )}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <HasLocationIcon
                                                    shape={shape}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </MuiTable>
                </TableContainer>
            )}
            <TablePagination
                className={classes.tablePagination}
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={shapes?.length ?? 0}
                rowsPerPage={rowsPerPage}
                page={page}
                labelRowsPerPage="Rows"
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
};
