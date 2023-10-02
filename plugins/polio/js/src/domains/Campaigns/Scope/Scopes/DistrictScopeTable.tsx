/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { FieldInputProps } from 'formik';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import {
    Table as MuiTable,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    Box,
} from '@material-ui/core';
import sortBy from 'lodash/sortBy';
import { cloneDeep } from 'lodash';
import MapIcon from '@material-ui/icons/Map';

import CheckIcon from '@material-ui/icons/Check';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import MESSAGES from '../../../../constants/messages';
import { useStyles } from '../../../../styles/theme';

import { Scope, Shape, FilteredDistricts, ShapeRow } from './types';
import { checkFullRegionIsPartOfScope } from './utils';

import { TableText } from './TableText';
import { TablePlaceHolder } from './TablePlaceHolder';
import { OrgUnit } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';

import { OrgUnitLocationIcon } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/components/OrgUnitLocationIcon';

type Props = {
    field: FieldInputProps<Scope[]>;
    regionShapes: Shape[];
    filteredDistricts?: FilteredDistricts[];
    toggleDistrictInVaccineScope: (
        // eslint-disable-next-line no-unused-vars
        district: FilteredDistricts,
    ) => void;
    toggleRegion: (
        // eslint-disable-next-line no-unused-vars
        district: FilteredDistricts,
    ) => void;
    page: number;
    // eslint-disable-next-line no-unused-vars
    setPage: (page: number) => void;
    isFetching: boolean;
    districtShapes: OrgUnit[];
    selectedVaccine: string;
};

export const DistrictScopeTable: FunctionComponent<Props> = ({
    field,
    regionShapes,
    filteredDistricts,
    toggleDistrictInVaccineScope,
    toggleRegion,
    page,
    setPage,
    isFetching,
    selectedVaccine,
    districtShapes,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { value: scopes = [] } = field;
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState('DISTRICT');

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
        if (!regionShapes || !filteredDistricts) {
            return null;
        }
        let ds: ShapeRow[] = cloneDeep(filteredDistricts) as ShapeRow[];

        if (sortFocus === 'REGION') {
            ds = sortBy(ds, ['region']);
        } else if (sortFocus === 'VACCINE') {
            ds = sortBy(ds, ['vaccineName']);
        } else if (sortFocus === 'LOCATION') {
            ds = sortBy(ds, ['latitude', 'longitude', 'has_geo_json']);
        }
        if (orderBy === 'desc') {
            ds = ds.reverse();
        }
        ds = ds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
        ds = ds.map(shape => ({
            ...shape,
            fullRegionIsPartOfScope: checkFullRegionIsPartOfScope(
                shape,
                selectedVaccine,
                districtShapes,
                scopes,
            ),
        }));
        return ds;
    }, [
        regionShapes,
        filteredDistricts,
        sortFocus,
        orderBy,
        page,
        rowsPerPage,
        scopes,
        selectedVaccine,
        districtShapes,
    ]);

    const displayPlaceHolder =
        isFetching || (!isFetching && filteredDistricts?.length === 0);
    return (
        <>
            <TableContainer className={classes.districtList}>
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
                            <TableCell
                                onClick={() => handleSort('VACCINE')}
                                variant="head"
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography>
                                    {formatMessage(MESSAGES.vaccine)}
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
                                <Box top="4px" position="relative" left="-3px">
                                    <MapIcon fontSize="small" color="inherit" />
                                </Box>
                            </TableCell>
                            <TableCell
                                variant="head"
                                style={{
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                }}
                            >
                                {formatMessage(MESSAGES.actions)}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayPlaceHolder && (
                            <TablePlaceHolder
                                isFetching={isFetching}
                                filteredDistricts={filteredDistricts}
                            />
                        )}
                        {shapesForTable?.map((shape, i) => {
                            return (
                                <TableRow
                                    key={shape.id}
                                    className={
                                        i % 2 > 0 ? classes.districtListRow : ''
                                    }
                                >
                                    <TableCell>
                                        <TableText text={shape.region} />
                                    </TableCell>
                                    <TableCell>
                                        <TableText text={shape.name} />
                                    </TableCell>
                                    <TableCell>
                                        <TableText
                                            text={shape.vaccineName || '-'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <OrgUnitLocationIcon orgUnit={shape} />
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            padding: 0,
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {shape.fullRegionIsPartOfScope && (
                                            <IconButtonComponent
                                                size="small"
                                                onClick={() =>
                                                    toggleRegion(shape)
                                                }
                                                color="primary"
                                                icon="clearAll"
                                                tooltipMessage={
                                                    MESSAGES.removeRegion
                                                }
                                            />
                                        )}
                                        {!shape.fullRegionIsPartOfScope && (
                                            <IconButtonComponent
                                                size="small"
                                                onClick={() =>
                                                    toggleRegion(shape)
                                                }
                                                color="primary"
                                                overrideIcon={SelectAllIcon}
                                                tooltipMessage={
                                                    MESSAGES.addRegion
                                                }
                                            />
                                        )}
                                        {shape.vaccineName && (
                                            <>
                                                <IconButtonComponent
                                                    size="small"
                                                    onClick={() =>
                                                        toggleDistrictInVaccineScope(
                                                            shape,
                                                        )
                                                    }
                                                    color="primary"
                                                    icon="clear"
                                                    tooltipMessage={
                                                        MESSAGES.removeDistrict
                                                    }
                                                />
                                            </>
                                        )}
                                        {!shape.vaccineName && (
                                            <>
                                                <IconButtonComponent
                                                    size="small"
                                                    onClick={() =>
                                                        toggleDistrictInVaccineScope(
                                                            shape,
                                                        )
                                                    }
                                                    color="primary"
                                                    overrideIcon={CheckIcon}
                                                    tooltipMessage={
                                                        MESSAGES.addDistrict
                                                    }
                                                />
                                            </>
                                        )}
                                    </TableCell>
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
                count={filteredDistricts?.length ?? 0}
                rowsPerPage={rowsPerPage}
                page={page}
                labelRowsPerPage="Rows"
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </>
    );
};
