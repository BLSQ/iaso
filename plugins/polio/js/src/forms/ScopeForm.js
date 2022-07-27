/* eslint-disable camelcase */
import React, { useState, useCallback, useMemo } from 'react';
import { useFormikContext } from 'formik';
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
} from '@material-ui/core';
import { MapComponent } from '../components/MapComponent/MapComponent';
import { useGetGeoJson } from '../hooks/useGetGeoJson';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import {
    initialDistrict,
    unselectedPathOptions,
    selectedPathOptions,
} from '../styles/constants';

const separate = (array, referenceArray) => {
    const result = {
        selected: [],
        unselected: [],
    };
    array.forEach(item => {
        if (referenceArray.includes(item)) {
            result.selected.push(item);
        } else {
            result.unselected.push(item);
        }
    });
    return result;
};

const findRegion = (shape, regionShapes) => {
    return regionShapes.filter(
        regionShape => regionShape.id === shape.parent_id,
    )[0]?.name;
};

export const ScopeForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [selectRegion, setSelectRegion] = useState(false);
    const { values, setFieldValue } = useFormikContext();
    // Group contains selected orgunits
    const { group = { org_units: [] } } = values;
    // Below var to avoid crash when group is null, as the default value will only be considered if group is undefined
    const nullSafeGroup = useMemo(() => group ?? { org_units: [] }, [group]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('asc');
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
            if (nullSafeGroup.org_units.includes(shape.id))
                return selectedPathOptions;
            if (values.org_unit?.id === shape.id) return initialDistrict;
            return unselectedPathOptions;
        },
        [nullSafeGroup, values.org_unit?.id],
    );

    const getBackgroundLayerStyle = () => {
        return {
            color: 'grey',
            opacity: '1',
            fillColor: 'transparent',
        };
    };

    const toggleRegion = (shape, allShapes, orgUnitsGroup) => {
        const parentRegionShapes = allShapes
            .filter(s => s.parent_id === shape.parent_id)
            .map(s => s.id);
        const { selected, unselected } = separate(
            parentRegionShapes,
            orgUnitsGroup,
        );
        const isRegionSelected = selected.length === parentRegionShapes.length;
        if (isRegionSelected) {
            return orgUnitsGroup.filter(
                orgUnit => !parentRegionShapes.includes(orgUnit),
            );
        }
        return [...orgUnitsGroup, ...unselected];
    };

    const toggleDistrict = (shape, orgUnitsGroup) => {
        if (orgUnitsGroup.find(org_unit => shape.id === org_unit)) {
            return orgUnitsGroup.filter(orgUnit => orgUnit !== shape.id);
        }
        return [...orgUnitsGroup, shape.id];
    };

    const onSelectOrgUnit = useCallback(
        shape => {
            const { org_units } = nullSafeGroup;
            let newOrgUnits;
            if (selectRegion) {
                newOrgUnits = toggleRegion(shape, districtShapes, org_units);
            } else {
                newOrgUnits = toggleDistrict(shape, org_units);
            }

            setFieldValue('group', {
                ...nullSafeGroup,
                org_units: newOrgUnits,
            });
        },
        [nullSafeGroup, setFieldValue, selectRegion, districtShapes],
    );

    const removeDistrictFromTable = useCallback(
        shape => {
            const { org_units } = nullSafeGroup;
            const newOrgUnits = org_units.filter(
                orgUnit => orgUnit !== shape.id,
            );
            setFieldValue('group', {
                ...nullSafeGroup,
                org_units: newOrgUnits,
            });
        },
        [nullSafeGroup, setFieldValue],
    );
    const removeRegionFromTable = useCallback(
        shape => {
            const { org_units } = nullSafeGroup;

            const parentRegionShapes = districtShapes
                .filter(s => s.parent_id === shape.parent_id)
                .map(s => s.id);

            const newOrgUnits = org_units.filter(
                orgUnit => !parentRegionShapes.includes(orgUnit),
            );

            setFieldValue('group', {
                ...nullSafeGroup,
                org_units: newOrgUnits,
            });
        },
        [nullSafeGroup, setFieldValue, districtShapes],
    );

    const handleSort = useCallback(
        orgUnitType => {
            if (sortFocus !== orgUnitType) {
                setSortFocus(orgUnitType);
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

    const sortShapesForTable = useCallback(() => {
        if (!regionShapes) {
            return null;
        }
        if (sortFocus === 'DISTRICT' && sortBy === 'asc') {
            return districtShapes?.filter(shape =>
                nullSafeGroup.org_units.includes(shape.id),
            );
        }
        if (sortFocus === 'DISTRICT' && sortBy === 'desc') {
            return districtShapes
                ?.filter(shape => nullSafeGroup.org_units.includes(shape.id))
                .reverse();
        }
        if (sortFocus === 'REGION' && sortBy === 'asc') {
            return districtShapes
                ?.filter(shape => nullSafeGroup.org_units.includes(shape.id))
                .sort(
                    (shapeA, shapeB) =>
                        findRegion(shapeA, regionShapes) >
                        findRegion(shapeB, regionShapes),
                );
        }
        if (sortFocus === 'REGION' && sortBy === 'desc') {
            return districtShapes
                ?.filter(shape => nullSafeGroup.org_units.includes(shape.id))
                .sort(
                    (shapeA, shapeB) =>
                        findRegion(shapeA, regionShapes) <
                        findRegion(shapeB, regionShapes),
                );
        }
        console.warn(
            `Sort error, there must be a wrong parameter. Received: ${sortBy}, ${sortFocus}. Expected a combination of asc|desc and DISTRICT|REGION`,
        );
        return null;
    }, [
        sortBy,
        sortFocus,
        districtShapes,
        nullSafeGroup.org_units,
        regionShapes,
    ]);

    const shapesForTable = sortShapesForTable();

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
            <Grid xs={8} item>
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
                                    const region = findRegion(
                                        shape,
                                        regionShapes,
                                    );
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
                                                    width: '33%',
                                                    cursor: 'default',
                                                }}
                                            >
                                                {makeTableText(region)}
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    width: '33%',
                                                    cursor: 'default',
                                                }}
                                            >
                                                {makeTableText(shape.name)}
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    minWidth: '33%',
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
            <Grid container>
                <Grid xs={8} item>
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
        </Grid>
    );
};
