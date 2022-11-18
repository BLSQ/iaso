/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useField, FieldInputProps } from 'formik';
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
import cloneDeep from 'lodash/cloneDeep';
import sortBy from 'lodash/sortBy';

import CheckIcon from '@material-ui/icons/Check';
import SelectAllIcon from '@material-ui/icons/SelectAll';
// @ts-ignore
import MESSAGES from '../../constants/messages';
import { useStyles } from '../../styles/theme';

import { Scope, Shape, FilteredDistricts, ShapeRow } from './types';
import { findScopeWithOrgUnit, findRegion } from './utils';

import { TableText } from './TableText';

type Props = {
    field: FieldInputProps<Scope[]>;
    searchLaunched: boolean;
    searchScopeChecked: boolean;
    // eslint-disable-next-line no-unused-vars
    addNewScopeId: (id: number, vaccineName: string) => void;
    selectedVaccine: string;
    regionShapes: Shape[];
    districtShapes?: FilteredDistricts[];
    // eslint-disable-next-line no-unused-vars
    setFilteredDistricts: (id: FilteredDistricts[]) => void;
    toggleDistrictInVaccineScope: (
        // eslint-disable-next-line no-unused-vars
        district: FilteredDistricts,
        // eslint-disable-next-line no-unused-vars
        selectedVac: string,
    ) => void;
    page: number;
    // eslint-disable-next-line no-unused-vars
    setPage: (page: number) => void;
    isFetching: boolean;
};

export const DistrictScopeTable: FunctionComponent<Props> = ({
    field,
    searchLaunched,
    searchScopeChecked,
    addNewScopeId,
    selectedVaccine,
    regionShapes,
    districtShapes,
    setFilteredDistricts,
    toggleDistrictInVaccineScope,
    page,
    setPage,
    isFetching,
}) => {
    const [, , helpers] = useField(field.name);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { value: scopes = [] } = field;
    const { setValue: setScopes } = helpers;
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState('DISTRICT');

    const addDistrictInVaccineScope = useCallback(
        district => {
            const newScopes: Scope[] = cloneDeep(scopes);
            let scope: Scope | undefined = newScopes.find(
                s => s.vaccine === selectedVaccine,
            );
            if (!scope) {
                scope = {
                    vaccine: selectedVaccine,
                    group: {
                        org_units: [],
                    },
                };
                newScopes.push(scope);
            }
            // Add org unit in selection if it's not part of the scope
            if (!scope.group.org_units.includes(district.id)) {
                scope.group.org_units.push(district.id);
            }
            // when the add is done on searched result and update the filteredDistricts state
            if ((searchLaunched || searchScopeChecked) && districtShapes) {
                const newListAfterAdding = [...districtShapes];
                districtShapes.forEach((dist, index) => {
                    if (dist.id === district.id) {
                        newListAfterAdding[index].vaccineName = selectedVaccine;
                        addNewScopeId(district.id, selectedVaccine);
                    }
                });
                setFilteredDistricts(newListAfterAdding);
            }

            setScopes(newScopes);
        },
        [
            addNewScopeId,
            districtShapes,
            scopes,
            searchLaunched,
            searchScopeChecked,
            selectedVaccine,
            setFilteredDistricts,
            setScopes,
        ],
    );

    const removeDistrictFromTable = useCallback(
        (shape: ShapeRow) => {
            toggleDistrictInVaccineScope(shape, shape.vaccineName);
        },
        [toggleDistrictInVaccineScope],
    );

    const addDistrictToTable = useCallback(
        (shape: ShapeRow) => {
            addDistrictInVaccineScope(shape);
        },
        [addDistrictInVaccineScope],
    );

    // Remove all district in the same region as this district
    const removeRegionFromTable = useCallback(
        (shape: ShapeRow) => {
            const OrgUnitIdsToRemove = districtShapes
                ?.filter(s => s.parent_id === shape.parent_id)
                .map(s => s.id);

            const newScopes: Scope[] = cloneDeep(scopes);
            scopes.forEach((scope, index) => {
                newScopes[index].group.org_units = scope.group.org_units.filter(
                    OrgUnitId => {
                        let idToRemove: number | undefined;
                        if (!OrgUnitIdsToRemove?.includes(OrgUnitId)) {
                            idToRemove = OrgUnitId;
                            addNewScopeId(OrgUnitId, '');
                        }
                        return idToRemove;
                    },
                );
            });

            if ((searchLaunched || searchScopeChecked) && districtShapes) {
                const newListAfterRegionRemoved = [...districtShapes];
                districtShapes.forEach((dist, index) => {
                    if (OrgUnitIdsToRemove?.includes(dist.id)) {
                        newListAfterRegionRemoved[index].vaccineName = '';
                        addNewScopeId(dist.id, '');
                    }
                });
                setFilteredDistricts(newListAfterRegionRemoved);
            }

            setScopes(newScopes);
        },
        [
            addNewScopeId,
            districtShapes,
            scopes,
            searchLaunched,
            searchScopeChecked,
            setFilteredDistricts,
            setScopes,
        ],
    );

    // Add all district in the same region as this district
    const addRegionToTable = useCallback(
        (shape: ShapeRow) => {
            const OrgUnitIdsToAdd = districtShapes
                .filter(s => s.parent_id === shape.parent_id)
                .map(s => s.id);

            const newScopes: Scope[] = cloneDeep(scopes);
            newScopes
                .filter(sc => sc.vaccine === selectedVaccine)
                .forEach((scope, index) => {
                    newScopes[index].group.org_units =
                        scope.group.org_units.concat(OrgUnitIdsToAdd);
                });

            if (searchLaunched || searchScopeChecked) {
                const newListAfterRegionAdded = [...districtShapes];
                districtShapes.forEach((dist, index) => {
                    if (OrgUnitIdsToAdd.includes(dist.id)) {
                        newListAfterRegionAdded[index].vaccineName =
                            selectedVaccine;
                        addNewScopeId(dist.id, selectedVaccine);
                    }
                });
                setFilteredDistricts(newListAfterRegionAdded);
            }

            setScopes(newScopes);
        },
        [
            addNewScopeId,
            districtShapes,
            scopes,
            searchLaunched,
            searchScopeChecked,
            selectedVaccine,
            setFilteredDistricts,
            setScopes,
        ],
    );

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
        if (!regionShapes || !districtShapes) {
            return null;
        }

        let ds: ShapeRow[] = districtShapes.map(district => {
            return {
                ...district,
                region: findRegion(district, regionShapes),
                vaccineName:
                    findScopeWithOrgUnit(scopes, district.id)?.vaccine || '',
            };
        });

        if (sortFocus === 'REGION') {
            ds = sortBy(ds, ['region']);
        } else if (sortFocus === 'VACCINE') {
            ds = sortBy(ds, ['vaccineName']);
        }
        if (orderBy === 'desc') {
            ds = ds.reverse();
        }
        return ds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [
        regionShapes,
        districtShapes,
        sortFocus,
        orderBy,
        page,
        rowsPerPage,
        scopes,
    ]);
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
                        {(isFetching ||
                            (!isFetching && districtShapes?.length === 0)) && (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Box textAlign="center" width="100%">
                                        {isFetching &&
                                            formatMessage(MESSAGES.loading)}
                                        {!isFetching &&
                                            districtShapes?.length === 0 &&
                                            formatMessage(MESSAGES.noOptions)}
                                    </Box>
                                </TableCell>
                            </TableRow>
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
                                        <TableText text={shape.vaccineName} />
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            padding: 0,
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {shape.vaccineName && (
                                            <>
                                                <IconButtonComponent
                                                    size="small"
                                                    onClick={() =>
                                                        removeRegionFromTable(
                                                            shape,
                                                        )
                                                    }
                                                    icon="clearAll"
                                                    tooltipMessage={
                                                        MESSAGES.removeRegion
                                                    }
                                                />
                                                <IconButtonComponent
                                                    size="small"
                                                    onClick={() =>
                                                        removeDistrictFromTable(
                                                            shape,
                                                        )
                                                    }
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
                                                        addRegionToTable(shape)
                                                    }
                                                    overrideIcon={SelectAllIcon}
                                                    tooltipMessage={
                                                        MESSAGES.addRegion
                                                    }
                                                />
                                                <IconButtonComponent
                                                    size="small"
                                                    onClick={() =>
                                                        addDistrictToTable(
                                                            shape,
                                                        )
                                                    }
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
                count={districtShapes?.length ?? 0}
                rowsPerPage={rowsPerPage}
                page={page}
                labelRowsPerPage="Rows"
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </>
    );
};
