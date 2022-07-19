/* eslint-disable camelcase */
import React, {
    useState,
    useCallback,
    useMemo,
    FunctionComponent,
} from 'react';
import { useField } from 'formik';
// @ts-ignore
import {
    useSafeIntl,
    LoadingSpinner,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import {
    FormControlLabel,
    FormGroup,
    Switch,
    Grid,
    Typography,
    TableContainer,
    Table as MuiTable,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    Tooltip,
    Radio,
    FormControl,
    FormLabel,
    RadioGroup,
} from '@material-ui/core';
import cloneDeep from 'lodash/cloneDeep';
import sortBy from 'lodash/sortBy';
import { FieldProps } from 'formik/dist/Field';
import { MapComponent } from '../MapComponent/MapComponent';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { useStyles } from '../../styles/theme';
import MESSAGES from '../../constants/messages';
import { polioVacines } from '../../constants/virus';

const selectedPathOptions = {
    color: 'lime',
    weight: '1',
    opacity: '1',
    zIndex: '1',
};
const unselectedPathOptions = {
    color: 'gray',
    weight: '1',
    opacity: '1',
    zIndex: '1',
};
const initialDistrict = {
    color: '#FF695C',
    weight: '1',
    opacity: '1',
    zIndex: '1',
};

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
};

export const ScopeInput: FunctionComponent<FieldProps<Scope[], Values>> = ({
    field,
    form: { values },
}) => {
    // eslint-disable-next-line no-unused-vars
    const [_field, _meta, helpers] = useField(field.name);
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [selectRegion, setSelectRegion] = useState(false);
    const { value: scopes } = field;
    const { setValue: setScopes } = helpers;

    // Group contains selected orgunits
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
    const country =
        values.org_unit?.country_parent?.id ||
        values.org_unit?.root?.id ||
        values.org_unit?.id;

    const { data: districtShapes, isFetching: isFetchingDistricts } =
        useGetGeoJson(country, 'DISTRICT');

    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        country,
        'REGION',
    );

    const isFetching = isFetchingDistricts || isFetchingRegions;

    const toggleRegionSelect = () => {
        setSelectRegion(!selectRegion);
    };

    const getShapeStyle = useCallback(
        shape => {
            const scope = findScopeWithOrgUnit(scopes, shape.id);

            if (scope) {
                const vaccine = polioVacines.find(
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
        if (scope === undefined) {
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
    const [selectedVaccine, setSelectedVaccine] = useState('mOPV2');

    const toggleDistrictInVaccineScope = useCallback(
        (district, _selectedVaccine) => {
            const newScopes: Scope[] = cloneDeep(scopes);
            let scope: Scope | undefined = newScopes.find(
                s => s.vaccine === _selectedVaccine,
            );
            if (scope === undefined) {
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
        [scopes, setScopes],
    );
    //
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
                    OrgUnitId => !OrgUnitIdsToRemove.includes(OrgUnitId),
                );
            });
            setScopes(newScopes);
        },
        [districtShapes, scopes, setScopes],
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
        <Grid container spacing={4}>
            <Grid xs={6} item>
                {isFetching && !districtShapes && <LoadingSpinner />}
                {!isFetching && !districtShapes && (
                    // FIXME should not be needed
                    <Typography>
                        {formatMessage(MESSAGES.pleaseSaveCampaign)}
                    </Typography>
                )}
                <MapComponent
                    name="ScopeMap"
                    mainLayer={districtShapes}
                    backgroundLayer={regionShapes}
                    onSelectShape={onSelectOrgUnit}
                    getMainLayerStyle={getShapeStyle}
                    getBackgroundLayerStyle={getBackgroundLayerStyle}
                    tooltipLabels={{ main: 'District', background: 'Region' }}
                />
            </Grid>
            <Grid xs={2} item container>
                <Grid item>
                    <FormControl id="vaccine">
                        <FormLabel>Vaccine</FormLabel>
                        <RadioGroup
                            aria-label="vaccineScope"
                            value={selectedVaccine}
                            onChange={event =>
                                setSelectedVaccine(event.target.value)
                            }
                        >
                            {polioVacines.map(vaccine => (
                                <FormControlLabel
                                    key={vaccine.value}
                                    value={vaccine.label}
                                    control={<Radio />}
                                    label={
                                        <>
                                            <span
                                                style={{ color: vaccine.color }}
                                            >
                                                {vaccine.value}
                                            </span>{' '}
                                            {vaccineCount[vaccine.value] ?? 0}{' '}
                                            districts
                                        </>
                                    }
                                />
                            ))}
                            {/* <FormControlLabel */}
                            {/*    value="" */}
                            {/*    control={<Radio />} */}
                            {/*    label="❌ Not part of campaign" */}
                            {/* /> */}
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item>
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
                </Grid>
                <Grid xs={4} item>
                    {districtShapes && isFetching && (
                        <Typography align="right">
                            {formatMessage(MESSAGES.refreshing)}
                        </Typography>
                    )}
                </Grid>
            </Grid>

            <Grid xs={4} item>
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
                                        {' '}
                                        {formatMessage(MESSAGES.district)}
                                    </Typography>
                                </TableCell>
                                <TableCell
                                    onClick={() => handleSort('VACCINE')}
                                    variant="head"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Typography>
                                        {' '}
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
                            {shapesForTable
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
                                            <TableCell
                                                style={{
                                                    width: '25%',
                                                    cursor: 'default',
                                                }}
                                            >
                                                {makeTableText(shape.region)}
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    width: '25%',
                                                    cursor: 'default',
                                                }}
                                            >
                                                {makeTableText(shape.name)}
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    width: '20%',
                                                    cursor: 'default',
                                                }}
                                            >
                                                {makeTableText(
                                                    shape.vaccineName,
                                                )}
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    minWidth: '30%',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <IconButtonComponent
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
                    count={shapesForTable?.length ?? 0}
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
