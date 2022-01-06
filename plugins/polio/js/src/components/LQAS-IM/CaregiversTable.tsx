/* eslint-disable react/require-default-props */
import React, {
    FunctionComponent,
    useState,
    useCallback,
    useMemo,
} from 'react';
import {
    TableContainer,
    Table as MuiTable,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    Box,
    Paper,
} from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';
import {
    LqasImCampaignDataWithNameAndRegion,
    RoundString,
} from '../../constants/types';
import { caregiverSourceInfoKeys } from '../../pages/IM/constants';
import { convertStatToPercent, makeDataForTable } from '../../pages/LQAS/utils';
import {
    sortbyDistrictNameAsc,
    sortbyDistrictNameDesc,
    sortbyRegionNameAsc,
    sortbyRegionNameDesc,
    sortSourceKeys,
} from './tableUtils';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import { CaregiversTableHeader } from './CaregiversTableHeader';

type Props = {
    // data: LqasImCampaignDataWithNameAndRegion[];
    marginTop?: boolean;
    tableKey: string;
    campaign?: string;
    round: RoundString;
};

type SortValues = 'DISTRICT' | 'REGION';

export const CaregiversTable: FunctionComponent<Props> = ({
    marginTop = true,
    tableKey,
    campaign = '',
    round,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: ClassNameMap<any> = useStyles();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [sortBy, setSortBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState<SortValues>('REGION');

    const { data: lqasImData, isLoading } = useConvertedLqasImData('lqas');
    const data = useMemo((): LqasImCampaignDataWithNameAndRegion[] => {
        return makeDataForTable(lqasImData, campaign, round);
    }, [lqasImData, campaign, round]);

    // TODO modify sort function to sort translated messages
    const orderedSourceInfoKeys = caregiverSourceInfoKeys.sort(
        sortSourceKeys(formatMessage, MESSAGES),
    );

    const handleSort = useCallback(
        focus => {
            if (sortFocus !== focus) {
                setSortFocus(focus);
            } else if (sortBy === 'asc') {
                setSortBy('desc');
            } else {
                setSortBy('asc');
            }
        },
        [sortBy, sortFocus],
    );

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const dataForTable = useMemo(() => {
        if (sortFocus === 'DISTRICT' && sortBy === 'asc') {
            return data.sort(sortbyDistrictNameAsc);
        }
        if (sortFocus === 'DISTRICT' && sortBy === 'desc') {
            return data.sort(sortbyDistrictNameDesc);
        }
        if (sortFocus === 'REGION' && sortBy === 'asc') {
            return data.sort(sortbyRegionNameAsc);
        }
        if (sortFocus === 'REGION' && sortBy === 'desc') {
            return data.sort(sortbyRegionNameDesc);
        }
        console.warn(
            `Sort error, there must be a wrong parameter. Received: ${sortBy}, ${sortFocus}. Expected a combination of asc|desc and DISTRICT|REGION`,
        );
        return null;
    }, [sortBy, sortFocus, data]);

    return (
        <>
            {!isLoading && campaign && (
                <>
                    <CaregiversTableHeader campaign={campaign} round={round} />
                    <Box mt={marginTop ? 4 : 0} mb={4}>
                        <Paper elevation={3}>
                            <TableContainer>
                                <MuiTable stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                onClick={() =>
                                                    handleSort('REGION')
                                                }
                                                variant="head"
                                                className={
                                                    classes.sortableTableHeadCell
                                                }
                                            >
                                                {formatMessage(MESSAGES.region)}
                                            </TableCell>
                                            <TableCell
                                                onClick={() =>
                                                    handleSort('DISTRICT')
                                                }
                                                variant="head"
                                                className={
                                                    classes.sortableTableHeadCell
                                                }
                                            >
                                                {formatMessage(
                                                    MESSAGES.district,
                                                )}
                                            </TableCell>
                                            {orderedSourceInfoKeys.map(
                                                (sourceInfoKey, i) => {
                                                    return (
                                                        <TableCell
                                                            key={`${tableKey}-head-${sourceInfoKey}-${i}`}
                                                            variant="head"
                                                            className={
                                                                classes.tableHeadCell
                                                            }
                                                        >
                                                            {formatMessage(
                                                                MESSAGES[
                                                                    sourceInfoKey
                                                                ],
                                                            )}
                                                        </TableCell>
                                                    );
                                                },
                                            )}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dataForTable
                                            ?.slice(
                                                page * rowsPerPage,
                                                page * rowsPerPage +
                                                    rowsPerPage,
                                            )
                                            .map((district, i) => {
                                                if (district) {
                                                    return (
                                                        <TableRow
                                                            key={`${tableKey}${district.name}${i}`}
                                                            className={
                                                                i % 2 > 0
                                                                    ? ''
                                                                    : classes.districtListRow
                                                            }
                                                        >
                                                            <TableCell
                                                                style={{
                                                                    cursor: 'default',
                                                                }}
                                                                align="center"
                                                                className={
                                                                    classes.lqasImTableCell
                                                                }
                                                            >
                                                                {
                                                                    district.region_name
                                                                }
                                                            </TableCell>
                                                            <TableCell
                                                                style={{
                                                                    cursor: 'default',
                                                                }}
                                                                align="center"
                                                                className={
                                                                    classes.lqasImTableCell
                                                                }
                                                            >
                                                                {district.name}
                                                            </TableCell>
                                                            {orderedSourceInfoKeys.map(
                                                                (
                                                                    sourceInfoKey,
                                                                    index,
                                                                ) => {
                                                                    return (
                                                                        <TableCell
                                                                            key={`${tableKey}${sourceInfoKey}${index}`}
                                                                            style={{
                                                                                cursor: 'default',
                                                                            }}
                                                                            align="center"
                                                                            className={
                                                                                classes.lqasImTableCell
                                                                            }
                                                                        >
                                                                            {sourceInfoKey ===
                                                                            'caregivers_informed'
                                                                                ? convertStatToPercent(
                                                                                      district
                                                                                          .care_giver_stats
                                                                                          .caregivers_informed,
                                                                                      district.total_child_checked,
                                                                                  )
                                                                                : convertStatToPercent(
                                                                                      district
                                                                                          .care_giver_stats[
                                                                                          sourceInfoKey
                                                                                      ],
                                                                                      district
                                                                                          .care_giver_stats
                                                                                          .caregivers_informed,
                                                                                  )}
                                                                        </TableCell>
                                                                    );
                                                                },
                                                            )}
                                                        </TableRow>
                                                    );
                                                }
                                                return null;
                                            })}
                                    </TableBody>
                                </MuiTable>
                            </TableContainer>
                            <TablePagination
                                className={classes.tablePagination}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                component="div"
                                count={data?.length ?? 0}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                labelRowsPerPage="Rows"
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </Paper>
                    </Box>
                </>
            )}
        </>
    );
};
