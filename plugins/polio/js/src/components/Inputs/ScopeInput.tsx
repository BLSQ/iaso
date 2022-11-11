/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useField } from 'formik';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import {
    FormControl,
    FormControlLabel,
    FormGroup,
    Grid,
    Switch,
    Table as MuiTable,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
    Box,
    List,
    ListItem,
} from '@material-ui/core';
import cloneDeep from 'lodash/cloneDeep';
import sortBy from 'lodash/sortBy';

import { FieldProps } from 'formik/dist/Field';

import CheckIcon from '@material-ui/icons/Check';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { values } from 'cypress/types/lodash';
import { MapComponent } from '../MapComponent/MapComponent';
import { MapLegend } from '../../../../../../hat/assets/js/apps/Iaso/components/maps/MapLegend';

import MESSAGES from '../../constants/messages';
import { polioVaccines } from '../../constants/virus';

import { useGetParentOrgUnit } from '../../hooks/useGetParentOrgUnit';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';

import {
    initialDistrict,
    selectedPathOptions,
    unselectedPathOptions,
} from '../../styles/constants';
import { useStyles } from '../../styles/theme';

type Scope = {
    vaccine: string;
    group: {
        org_units: number[];
        id?: number;
    };
};

type Shape = {
    name: string;
    id: number;
    parent_id: number;
    country_parent?: { id: number };
    root?: { id: number };
};
type ShapeRow = Shape & {
    region: string;
    vaccineName: string;
};

const findRegion = (shape: Shape, regionShapes: Shape[]) => {
    return regionShapes.filter(
        regionShape => regionShape.id === shape.parent_id,
    )[0]?.name;
};

const findScopeWithOrgUnit = (scopes: Scope[], orgUnitId: number) => {
    const scope = scopes.find(s => {
        return s.group?.org_units.includes(orgUnitId);
    });
    return scope;
};
type Values = {
    scopes?: Scope[];
    org_unit: Shape;
    initial_org_unit: number;
};

type FilteredDistricts = {
    name: string;
    vaccineName: string;
    region: any;
    id: number;
    parent_id: number;
};

type Props = {
    field;
    form: FieldProps<Scope[], Values>;
    values: values;
    filteredDistrictsResult: FilteredDistricts[];
    searchLaunched: boolean;
    searchScopeValue: boolean;
    searchScopeChecked: boolean;
    onChangeSearchScopeFunction: () => void;
    addNewScopeId: (id: number, vaccineName: string) => void;
};

export const ScopeInput: FunctionComponent<Props> = ({
    field,
    form: { values },
    filteredDistrictsResult,
    searchLaunched,
    searchScopeValue,
    searchScopeChecked,
    onChangeSearchScopeFunction,
    addNewScopeId,
}) => {
    // eslint-disable-next-line no-unused-vars
    const [_field, _meta, helpers] = useField(field.name);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [selectRegion, setSelectRegion] = useState(false);
    const { value: scopes = [] } = field;
    const { setValue: setScopes } = helpers;
    const vaccineCount = useMemo(
        () =>
            Object.fromEntries(
                scopes.map(scope => [
                    scope.vaccine,
                    scope.group?.org_units?.length ?? 0,
                ]),
            ),
        [scopes],
    );
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState('DISTRICT');

    const { data: country } = useGetParentOrgUnit(values.initial_org_unit);

    const parentCountryId =
        country?.country_parent?.id || country?.root?.id || country?.id;

    const { data: districtShapes, isFetching: isFetchingDistricts } =
        useGetGeoJson(parentCountryId, 'DISTRICT');
    const [filteredDistricts, setFilteredDistricts] = useState<
        FilteredDistricts[]
    >([]);
    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        parentCountryId,
        'REGION',
    );

    const isFetching = isFetchingDistricts || isFetchingRegions;

    const toggleRegionSelect = () => {
        setSelectRegion(!selectRegion);
    };

    useEffect(() => {
        const filtereds = filteredDistrictsResult;
        setFilteredDistricts(filtereds);
    }, [filteredDistrictsResult]);

    const getShapeStyle = useCallback(
        shape => {
            const scope = findScopeWithOrgUnit(scopes, shape.id);

            if (scope) {
                const vaccine = polioVaccines.find(
                    v => v.value === scope.vaccine,
                );
                return {
                    ...selectedPathOptions,
                    color: vaccine?.color,
                };
            }
            if (values.org_unit?.id === shape.id) return initialDistrict;
            return unselectedPathOptions;
        },
        [values.org_unit?.id, scopes],
    );

    const getBackgroundLayerStyle = () => {
        return {
            color: 'grey',
            opacity: '1',
            fillColor: 'transparent',
        };
    };

    const toggleRegion = (
        selectOrgUnit: Shape,
        _selectedVaccine,
        allDistricts: Shape[],
    ) => {
        const OrgUnitsIdInSameRegion: number[] = allDistricts
            .filter(s => s.parent_id === selectOrgUnit.parent_id)
            .map(s => s.id);
        const newScopes: Scope[] = cloneDeep(scopes);
        // Find scope for vaccine
        let scope: Scope | undefined = newScopes.find(
            s => s.vaccine === _selectedVaccine,
        );
        if (!scope) {
            scope = {
                vaccine: _selectedVaccine,
                group: {
                    org_units: [],
                },
            };
            newScopes.push(scope);
        }
        // if all the orgunits from this region are already in this vaccine scope, remove them
        // @ts-ignore
        if (
            OrgUnitsIdInSameRegion.every(OrgUnitId =>
                // @ts-ignore
                scope.group.org_units.includes(OrgUnitId),
            )
        ) {
            scope.group.org_units = scope.group.org_units.filter(
                OrgUnitId => !OrgUnitsIdInSameRegion.includes(OrgUnitId),
            );
        } else {
            // Remove the OrgUnits from all the scopes
            newScopes.forEach(s => {
                // eslint-disable-next-line no-param-reassign
                s.group.org_units = s.group.org_units.filter(
                    OrgUnitId => !OrgUnitsIdInSameRegion.includes(OrgUnitId),
                );
            });
            // Add the OrgUnit in the scope for selected vaccine
            scope.group.org_units = [
                ...scope.group.org_units,
                ...OrgUnitsIdInSameRegion,
            ];
        }
        setScopes(newScopes);
    };

    const [selectedVaccine, setSelectedVaccine] = useState<string>('mOPV2');

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
            if (searchLaunched || searchScopeChecked) {
                const newListAfterAdding = [...filteredDistricts];
                filteredDistricts.forEach((dist, index) => {
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
            filteredDistricts,
            scopes,
            searchLaunched,
            searchScopeChecked,
            selectedVaccine,
            setScopes,
        ],
    );

    const toggleDistrictInVaccineScope = useCallback(
        (district, _selectedVaccine) => {
            const newScopes: Scope[] = cloneDeep(scopes);
            let scope: Scope | undefined = newScopes.find(
                s => s.vaccine === _selectedVaccine,
            );

            if (!scope) {
                scope = {
                    vaccine: _selectedVaccine,
                    group: {
                        org_units: [],
                    },
                };
                newScopes.push(scope);
            }
            // Remove org unit from selection if it's part of the scope
            if (scope.group.org_units.includes(district.id)) {
                if (searchLaunched || searchScopeChecked) {
                    const newListAfterRemove = [...filteredDistricts];
                    filteredDistricts.forEach((dist, index) => {
                        if (dist.id === district.id) {
                            newListAfterRemove[index].vaccineName = '';
                        }
                    });
                    setFilteredDistricts(newListAfterRemove);
                }
                addNewScopeId(district.id, '');
                scope.group.org_units = scope.group.org_units.filter(
                    OrgUnitId => OrgUnitId !== district.id,
                );
            } else {
                // Remove the orgunit from all the scope in case it's part of another scope
                newScopes.forEach(s => {
                    if (s.group.org_units.includes(district.id)) {
                        // eslint-disable-next-line no-param-reassign
                        s.group.org_units = s.group.org_units.filter(
                            OrgUnitId => OrgUnitId !== district.id,
                        );
                    }
                });
                // Add org unit to proper scope
                scope.group.org_units = [...scope.group.org_units, district.id];
            }
            setScopes(newScopes);
        },
        [
            addNewScopeId,
            filteredDistricts,
            scopes,
            searchLaunched,
            searchScopeChecked,
            setScopes,
        ],
    );

    const onSelectOrgUnit = shape => {
        if (selectRegion) {
            toggleRegion(shape, selectedVaccine, districtShapes);
        } else {
            toggleDistrictInVaccineScope(shape, selectedVaccine);
        }
    };

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
                .filter(s => s.parent_id === shape.parent_id)
                .map(s => s.id);

            const newScopes: Scope[] = cloneDeep(scopes);
            newScopes.forEach(scope => {
                // eslint-disable-next-line no-param-reassign
                scope.group.org_units = scope.group.org_units.filter(
                    OrgUnitId => {
                        addNewScopeId(OrgUnitId, '');
                        if (!OrgUnitIdsToRemove.includes(OrgUnitId)) {
                            return OrgUnitId;
                        }
                    },
                );
            });

            if (searchLaunched || searchScopeChecked) {
                const newListAfterRegionRemoved = [...filteredDistricts];
                filteredDistricts.forEach((dist, index) => {
                    if (OrgUnitIdsToRemove.includes(dist.id)) {
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
            filteredDistricts,
            scopes,
            searchLaunched,
            searchScopeChecked,
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
                .forEach(scope => {
                    // eslint-disable-next-line no-param-reassign
                    scope.group.org_units =
                        scope.group.org_units.concat(OrgUnitIdsToAdd);
                });

            if (searchLaunched || searchScopeChecked) {
                const newListAfterRegionAdded = [...filteredDistricts];
                filteredDistricts.forEach((dist, index) => {
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
            filteredDistricts,
            scopes,
            searchLaunched,
            searchScopeChecked,
            selectedVaccine,
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

        let ds: ShapeRow[] = districtShapes
            .map(district => {
                return {
                    ...district,
                    region: findRegion(district, regionShapes),
                    vaccineName: findScopeWithOrgUnit(scopes, district.id)
                        ?.vaccine,
                };
            })
            .filter(d => d.vaccineName);

        if (sortFocus === 'REGION') {
            ds = sortBy(ds, ['region']);
        } else if (sortFocus === 'VACCINE') {
            ds = sortBy(ds, ['vaccineName']);
        }
        if (orderBy === 'desc') {
            ds = ds.reverse();
        }

        return ds;
    }, [regionShapes, districtShapes, sortFocus, orderBy, scopes]);

    const makeTableText = text => {
        return (
            <Tooltip placement="bottom" title={text ?? 'no text'}>
                <Typography
                    variant="overline"
                    style={{
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {text}
                </Typography>
            </Tooltip>
        );
    };

    return (
        <Grid container spacing={4} style={{ marginTop: '2px' }}>
            <Grid xs={7} item style={{ marginTop: '15px' }}>
                {isFetching && !districtShapes && <LoadingSpinner />}
                {!isFetching && !districtShapes && (
                    // FIXME should not be needed
                    <Typography>
                        {formatMessage(MESSAGES.pleaseSaveCampaign)}
                    </Typography>
                )}
                <Box position="relative">
                    <MapComponent
                        name="ScopeMap"
                        mainLayer={districtShapes}
                        backgroundLayer={regionShapes}
                        onSelectShape={onSelectOrgUnit}
                        getMainLayerStyle={getShapeStyle}
                        getBackgroundLayerStyle={getBackgroundLayerStyle}
                        tooltipLabels={{
                            main: 'District',
                            background: 'Region',
                        }}
                    />

                    <MapLegend
                        titleMessage={MESSAGES.vaccine}
                        width={175}
                        content={
                            <FormControl id="vaccine">
                                <List>
                                    {polioVaccines.map(vaccine => (
                                        <ListItem
                                            key={vaccine.value}
                                            button
                                            className={classes.vaccinesList}
                                            onClick={() =>
                                                setSelectedVaccine(
                                                    vaccine.value,
                                                )
                                            }
                                        >
                                            <Box
                                                className={
                                                    classes.vaccinesSelect
                                                }
                                            >
                                                <span
                                                    style={{
                                                        backgroundColor:
                                                            vaccine.color,
                                                    }}
                                                    className={
                                                        classes.roundColor
                                                    }
                                                >
                                                    {selectedVaccine ===
                                                        vaccine.value && (
                                                        <span
                                                            className={
                                                                classes.roundColorInner
                                                            }
                                                        />
                                                    )}
                                                </span>
                                                <span
                                                    className={
                                                        classes.vaccineName
                                                    }
                                                >
                                                    {vaccine.value}
                                                </span>
                                                {': '}
                                                {vaccineCount[vaccine.value] ??
                                                    0}{' '}
                                                {formatMessage(
                                                    MESSAGES.districts,
                                                )}
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            </FormControl>
                        }
                    />
                </Box>
                <FormGroup>
                    <FormControlLabel
                        style={{ width: 'max-content' }}
                        control={
                            <Switch
                                size="medium"
                                checked={selectRegion}
                                onChange={toggleRegionSelect}
                                color="primary"
                            />
                        }
                        label={formatMessage(MESSAGES.selectRegion)}
                    />
                </FormGroup>
                {districtShapes && isFetching && (
                    <Typography align="right">
                        {formatMessage(MESSAGES.refreshing)}
                    </Typography>
                )}
            </Grid>
            <Grid xs={5} item>
                <InputComponent
                    keyValue="searchScope"
                    type="checkbox"
                    withMarginTop={false}
                    onChange={() => onChangeSearchScopeFunction()}
                    value={searchScopeValue}
                    label={MESSAGES.searchInScopeOrAllDistricts}
                />
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
                            {(searchLaunched || searchScopeChecked
                                ? filteredDistricts
                                : shapesForTable
                            )
                                ?.slice(
                                    page * rowsPerPage,
                                    page * rowsPerPage + rowsPerPage,
                                )
                                .map((shape, i) => {
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
                                                {makeTableText(shape.region)}
                                            </TableCell>
                                            <TableCell>
                                                {makeTableText(shape.name)}
                                            </TableCell>
                                            <TableCell>
                                                {makeTableText(
                                                    shape.vaccineName,
                                                )}
                                            </TableCell>
                                            {shape.vaccineName && (
                                                <TableCell
                                                    style={{
                                                        padding: 0,
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                    }}
                                                >
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
                                                </TableCell>
                                            )}
                                            {!shape.vaccineName && (
                                                <TableCell
                                                    style={{
                                                        padding: 0,
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    <IconButtonComponent
                                                        size="small"
                                                        onClick={() =>
                                                            addRegionToTable(
                                                                shape,
                                                            )
                                                        }
                                                        overrideIcon={
                                                            SelectAllIcon
                                                        }
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
                    count={
                        searchLaunched || searchScopeChecked
                            ? filteredDistricts?.length
                            : shapesForTable?.length ?? 0
                    }
                    rowsPerPage={rowsPerPage}
                    page={page}
                    labelRowsPerPage="Rows"
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Grid>
            <Grid container />
        </Grid>
    );
};
