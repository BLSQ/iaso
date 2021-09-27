/* eslint-disable camelcase */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Table,
    LoadingSpinner,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    Switch,
    Grid,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Tab,
    Tabs,
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
import { merge } from 'lodash';
import AddIcon from '@material-ui/icons/Add';
import DownloadIcon from '@material-ui/icons/GetApp';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';

import { Field, FormikProvider, useFormik, useFormikContext } from 'formik';
import SearchIcon from '@material-ui/icons/Search';
import { useDebounce } from 'use-debounce';
import moment from 'moment';
import { defineMessage } from 'react-intl';
import {
    DateInput,
    ResponsibleField,
    PaymentField,
    Select,
    StatusField,
    RABudgetStatusField,
    TextInput,
} from './Inputs';
import { MapComponent } from './MapComponent/MapComponent';

import { polioVacines, polioViruses } from '../constants/virus';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { OrgUnitsLevels } from './Inputs/OrgUnitsSelect';
import { useSaveCampaign } from '../hooks/useSaveCampaign';
import { useRemoveCampaign } from '../hooks/useRemoveCampaign';
import { useStyles } from '../styles/theme';
import { PreparednessForm } from '../forms/PreparednessForm';
import { useGetGeoJson } from '../hooks/useGetGeoJson';
import MESSAGES from '../constants/messages';
import { convertEmptyStringToNull } from '../utils/convertEmptyStringToNull';

import TopBar from '../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import ImportLineListDialog from './ImportLineListDialog';
import { postRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackMutation } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { useFormValidator } from '../hooks/useFormValidator';

const PageAction = ({ icon: Icon, onClick, children }) => {
    const classes = useStyles();

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            className={classes.pageAction}
        >
            <Icon className={classes.buttonIcon} />
            {children}
        </Button>
    );
};

const defaultToZero = value => (value === '' ? 0 : value);

const SendEmailButton = () => {
    const mutation = useSnackMutation(
        campaignId =>
            postRequest(
                `/api/polio/campaigns/${campaignId}/send_notification_email/`,
            ),
        defineMessage({
            id: 'iaso.polio.sendEmail.success',
            defaultMessage: 'Notification Email sent',
        }),
        defineMessage({
            id: 'iaso.polio.sendEmail.error',
            defaultMessage: 'Error sending notification email',
        }),
    );
    const form = useFormikContext();
    const { values } = form;
    const msg = 'Send an e-mail to notify people of the campaign';

    let validation_error = null;
    if (values.creation_email_send_at) {
        validation_error = `Email already sent on ${moment(
            values.creation_email_send_at,
        ).format('LTS')}`;
    } else if (!values.obr_name) {
        validation_error = 'Enter a name';
    } else if (!values.virus) {
        validation_error = 'Enter Virus information';
    } else if (!values.initial_org_unit) {
        validation_error = 'Enter Initial district';
    } else if (!values.onset_at) {
        validation_error = 'Enter Onset Date';
    } else if (form.dirty || !values.id) {
        validation_error = 'Please save the modifications on the campaign';
    }

    return (
        <Grid container item>
            <Tooltip title={validation_error ?? msg}>
                {/* Span is necessary because otherwise tooltip won't show
                 when button is disabled */}
                <span>
                    <Button
                        color="primary"
                        disabled={Boolean(validation_error)}
                        onClick={async () => mutation.mutate(values.id)}
                    >
                        {mutation.isLoading && <LoadingSpinner absolute />}
                        Notify coordinators by e-mail
                    </Button>
                    {mutation?.error?.details?.map((error_msg, i) => (
                        <Typography key={i} color="error">
                            {error_msg}
                        </Typography>
                    ))}
                </span>
            </Tooltip>
        </Grid>
    );
};

const BaseInfoForm = () => {
    const classes = useStyles();

    return (
        <>
            <Grid container spacing={2}>
                <Grid xs={12} item>
                    <Typography>
                        Enter information about the new outbreak response
                    </Typography>
                </Grid>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            label="EPID"
                            name="epid"
                            component={TextInput}
                            className={classes.input}
                        />

                        <Field
                            label="OBR Name"
                            name="obr_name"
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Field
                            label="Virus"
                            name="virus"
                            className={classes.input}
                            options={polioViruses}
                            component={Select}
                        />
                        <Field
                            label="Vacines"
                            name="vacine"
                            options={polioVacines}
                            component={Select}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Field
                        className={classes.input}
                        label="Description"
                        name="description"
                        component={TextInput}
                    />
                    <Field
                        className={classes.input}
                        label="GPEI Coordinator"
                        name="gpei_coordinator"
                        component={TextInput}
                    />
                    <Field
                        className={classes.input}
                        name="initial_org_unit"
                        label="Select initial region"
                        component={OrgUnitsLevels}
                    />
                </Grid>
                <Grid item xs={6} md={6}>
                    <SendEmailButton />
                </Grid>
                <Grid container item spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Field
                            className={classes.input}
                            label="Date of onset"
                            fullWidth
                            name="onset_at"
                            component={DateInput}
                        />
                        <Field
                            className={classes.input}
                            label="cVDPV2 notification date"
                            fullWidth
                            name="cvdpv2_notified_at"
                            component={DateInput}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Field
                            className={classes.input}
                            label="PV2 notification date"
                            fullWidth
                            name="pv_notified_at"
                            component={DateInput}
                        />
                        <Field
                            className={classes.input}
                            label="3 level call"
                            fullWidth
                            name="three_level_call_at"
                            component={DateInput}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
const DetectionForm = () => {
    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="detection_status"
                            component={StatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="detection_responsible"
                            component={ResponsibleField}
                        />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <Field
                        label="Date of onset"
                        fullWidth
                        name="onset_at"
                        component={DateInput}
                    />

                    <Field
                        label="PV2 notification date"
                        fullWidth
                        name="pv_notified_at"
                        component={DateInput}
                    />
                    <Field
                        label="cVDPV2 notification date"
                        fullWidth
                        name="cvdpv2_notified_at"
                        component={DateInput}
                    />
                </Grid>
            </Grid>
        </>
    );
};

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

const RiskAssessmentForm = () => {
    const classes = useStyles();
    useFormikContext();

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="risk_assessment_status"
                            component={RABudgetStatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="risk_assessment_responsible"
                            component={ResponsibleField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            label="Verification Score (/20)"
                            name="verification_score"
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <Field
                        label="Field Investigation Date"
                        name="investigation_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="3 level call"
                        name="three_level_call_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="1st Draft Submission"
                        name="risk_assessment_first_draft_submitted_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="RRT/OPRTT Approval"
                        name="risk_assessment_rrt_oprtt_approval_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="AG/nOPV Group"
                        name="ag_nopv_group_met_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="DG Authorization"
                        name="dg_authorized_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="Target population Round 1"
                        name="round_one.target_population"
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label="Target population Round 2"
                        name="round_two.target_population"
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label="Doses Requested (both rounds)"
                        name="doses_requested"
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
            </Grid>
        </>
    );
};

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
    )[0].name;
};

const ScopeForm = () => {
    const classes = useStyles();
    const [selectRegion, setSelectRegion] = useState(false);
    const { values, setFieldValue } = useFormikContext();
    // Group contains selected orgunits
    const { group = { org_units: [] } } = values;
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
            if (group.org_units.includes(shape.id)) return selectedPathOptions;
            if (values.org_unit?.id === shape.id) return initialDistrict;
            return unselectedPathOptions;
        },
        [group, values.org_unit?.id],
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
            const { org_units } = group;
            let newOrgUnits;
            if (selectRegion) {
                newOrgUnits = toggleRegion(shape, districtShapes, org_units);
            } else {
                newOrgUnits = toggleDistrict(shape, org_units);
            }

            setFieldValue('group', {
                ...group,
                org_units: newOrgUnits,
            });
        },
        [group, setFieldValue, selectRegion, districtShapes],
    );

    const removeDistrictFromTable = useCallback(
        shape => {
            const { org_units } = group;
            const newOrgUnits = org_units.filter(
                orgUnit => orgUnit !== shape.id,
            );
            setFieldValue('group', {
                ...group,
                org_units: newOrgUnits,
            });
        },
        [group, setFieldValue],
    );
    const removeRegionFromTable = useCallback(
        shape => {
            const { org_units } = group;
            const parentRegionShapes = districtShapes
                .filter(s => s.parent_id === shape.parent_id)
                .map(s => s.id);

            const newOrgUnits = org_units.filter(
                orgUnit => !parentRegionShapes.includes(orgUnit),
            );

            setFieldValue('group', {
                ...group,
                org_units: newOrgUnits,
            });
        },
        [group, setFieldValue, districtShapes],
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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = event => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const sortShapesForTable = useCallback(() => {
        if (sortFocus === 'DISTRICT' && sortBy === 'asc') {
            return districtShapes?.filter(shape =>
                group.org_units.includes(shape.id),
            );
        }
        if (sortFocus === 'DISTRICT' && sortBy === 'desc') {
            return districtShapes
                ?.filter(shape => group.org_units.includes(shape.id))
                .reverse();
        }
        if (sortFocus === 'REGION' && sortBy === 'asc') {
            return districtShapes
                ?.filter(shape => group.org_units.includes(shape.id))
                .sort(
                    (shapeA, shapeB) =>
                        findRegion(shapeA, regionShapes) >
                        findRegion(shapeB, regionShapes),
                );
        }
        if (sortFocus === 'REGION' && sortBy === 'desc') {
            return districtShapes
                ?.filter(shape => group.org_units.includes(shape.id))
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
    }, [sortBy, sortFocus, districtShapes, group.org_units, regionShapes]);

    const shapesForTable = sortShapesForTable();

    const makeTableText = text => {
        return (
            <Tooltip placement="bottom" title={text}>
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
                        Please save the Campaign before selecting scope.
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
                                    <Typography>Region</Typography>
                                </TableCell>
                                <TableCell
                                    onClick={() => handleSort('DISTRICT')}
                                    variant="head"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Typography>District</Typography>
                                </TableCell>
                                <TableCell
                                    variant="head"
                                    style={{
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                    }}
                                >
                                    Actions
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
                            label="Select region"
                        />
                    </FormGroup>
                </Grid>
                <Grid xs={4} item>
                    {districtShapes && isFetching && (
                        <Typography align="right">Refreshing ...</Typography>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

const BudgetForm = () => {
    const classes = useStyles();

    const { values } = useFormikContext();

    const round1Cost = parseInt(
        defaultToZero(values?.round_one?.cost ?? 0),
        10,
    );
    const round2Cost = parseInt(
        defaultToZero(values?.round_two?.cost ?? 0),
        10,
    );

    const round1Population = parseInt(
        defaultToZero(values?.round_one?.target_population ?? 0),
        10,
    );
    const round2Population = parseInt(
        defaultToZero(values?.round_two?.target_population ?? 0),
        10,
    );

    const calculateRound1 = round1Cost > 0 && round1Population > 0;
    const calculateRound2 = round2Cost > 0 && round2Population > 0;

    const totalCost =
        (calculateRound1 ? round1Cost : 0) + (calculateRound2 ? round2Cost : 0);

    const totalPopulation =
        (calculateRound1 ? round1Population : 0) +
        (calculateRound2 ? round2Population : 0);

    const costRound1PerChild = calculateRound1
        ? (round1Cost / round1Population).toFixed(2)
        : 0;

    const costRound2PerChild = calculateRound2
        ? (round2Cost / round2Population).toFixed(2)
        : 0;

    const totalCostPerChild = (totalCost / totalPopulation).toFixed(2);

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="budget_status"
                            component={RABudgetStatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="budget_responsible"
                            component={ResponsibleField}
                        />
                    </Grid>
                </Grid>

                <Grid xs={12} md={6} item>
                    <Box mb={2}>
                        <Field
                            name="payment_mode"
                            component={PaymentField}
                            fullWidth
                        />
                    </Box>
                    <Field
                        label="Disbursed to CO (WHO)"
                        name="who_disbursed_to_co_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="Disbursed to MOH (WHO)"
                        name="who_disbursed_to_moh_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="Disbursed to CO (UNICEF)"
                        name="unicef_disbursed_to_co_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="Disbursed to MOH (UNICEF)"
                        name="unicef_disbursed_to_moh_at"
                        component={DateInput}
                        fullWidth
                    />
                </Grid>

                <Grid item md={6}>
                    <Field
                        label="RRT/OPRTT Approval"
                        name="budget_rrt_oprtt_approval_at"
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label="EOMG Group"
                        name="eomg"
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label="Budget Submitted At"
                        name="budget_submitted_at"
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label="District Count"
                        name="district_count"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label="No Regret Fund"
                        name="no_regret_fund_amount"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label="Cost Round 1"
                        name="round_one.cost"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label="Cost Round 2"
                        name="round_two.cost"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Typography>
                        Cost/Child Round 1: $
                        {calculateRound1 ? costRound1PerChild : ' -'}
                    </Typography>
                    <Typography>
                        Cost/Child Round 2: $
                        {calculateRound2 ? costRound2PerChild : ' -'}
                    </Typography>
                    <Typography>
                        Cost/Child Total: $
                        {calculateRound1 || calculateRound2
                            ? totalCostPerChild
                            : ' -'}
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
};

const Round1Form = () => {
    const classes = useStyles();

    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={6} item>
                <Field
                    label="Round 1 Start"
                    name="round_one.started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label="Round 1 End"
                    name="round_one.ended_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Mop Up Start"
                    name="round_one.mop_up_started_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Mop Up End"
                    name="round_one.mop_up_ended_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label="IM Start"
                    name="round_one.im_started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label="IM End"
                    name="round_one.im_ended_at"
                    component={DateInput}
                    fullWidth
                />
            </Grid>
            <Grid xs={12} md={6} item>
                <Field
                    label="LQAS Start"
                    name="round_one.lqas_started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label="LQAS End"
                    name="round_one.lqas_ended_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Districts passing LQAS"
                    name="round_one.lqas_district_passing"
                    // as={NumberInput}
                    // keyValue="round_one.lqas_district_passing"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Districts failing LQAS"
                    name="round_one.lqas_district_failing"
                    // as={NumberInput}
                    // keyValue="round_one.lqas_district_failing"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Main reason for non-vaccination"
                    name="round_one.main_awareness_problem"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN household"
                    name="round_one.im_percentage_children_missed_in_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed OUT OF household"
                    name="round_one.im_percentage_children_missed_out_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN+OUT OF household"
                    name="round_one.im_percentage_children_missed_in_plus_out_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Awareness of campaign planning (%)"
                    name="round_one.awareness_of_campaign_planning"
                    component={TextInput}
                    className={classes.input}
                />
            </Grid>
        </Grid>
    );
};
const Round2Form = () => {
    const classes = useStyles();

    return (
        <Grid container spacing={2}>
            <Grid xs={12} md={6} item>
                <Field
                    label="Round 2 Start"
                    name="round_two.started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label="Round 2 End"
                    name="round_two.ended_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Mop Up Start"
                    name="round_two.mop_up_started_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Mop Up End"
                    name="round_two.mop_up_ended_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="IM Start"
                    name="round_two.im_started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label="IM End"
                    name="round_two.im_ended_at"
                    component={DateInput}
                    fullWidth
                />
            </Grid>
            <Grid xs={12} md={6} item>
                <Field
                    label="LQAS Start"
                    name="round_two.lqas_started_at"
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label="LQAS End"
                    name="round_two.lqas_ended_at"
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Districts passing LQAS"
                    name="round_two.lqas_district_passing"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Districts failing LQAS"
                    name="round_two.lqas_district_failing"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Main reason for non-vaccination"
                    name="round_two.main_awareness_problem"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN household"
                    name="round_two.im_percentage_children_missed_in_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed OUT OF household"
                    name="round_two.im_percentage_children_missed_out_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN+OUT OF household"
                    name="round_two.im_percentage_children_missed_in_plus_out_household"
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Awareness of campaign planning (%)"
                    name="round_two.awareness_of_campaign_planning"
                    component={TextInput}
                    className={classes.input}
                />
            </Grid>
        </Grid>
    );
};

const Form = ({ children }) => {
    const classes = useStyles();

    return (
        <Box
            component="form"
            className={classes.form}
            noValidate
            autoComplete="off"
        >
            {children}
        </Box>
    );
};

export const CreateEditDialog = ({ isOpen, onClose, selectedCampaign }) => {
    const { mutate: saveCampaign } = useSaveCampaign();
    const schema = useFormValidator();

    const classes = useStyles();

    const handleSubmit = async (values, helpers) => {
        saveCampaign(convertEmptyStringToNull(values), {
            onSuccess: () => {
                helpers.resetForm();
                onClose();
            },
            onError: error => {
                helpers.setErrors(error);
            },
        });
    };

    const defaultValues = {
        round_one: {},
        round_two: {},
        group: {
            name: 'hidden group',
            org_units: [],
        },
    };

    const initialValues = merge(selectedCampaign, defaultValues);

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: handleSubmit,
    });

    const tabs = [
        {
            title: 'Base info',
            form: BaseInfoForm,
        },
        {
            title: 'Detection',
            form: DetectionForm,
        },
        {
            title: 'Risk Assessment',
            form: RiskAssessmentForm,
        },
        {
            title: 'Scope',
            form: ScopeForm,
        },
        {
            title: 'Budget',
            form: BudgetForm,
        },
        {
            title: 'Preparedness',
            form: PreparednessForm,
        },
        {
            title: 'Round 1',
            form: Round1Form,
        },
        {
            title: 'Round 2',
            form: Round2Form,
        },
    ];

    const [selectedTab, setSelectedTab] = useState(0);

    const handleChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const CurrentForm = tabs[selectedTab].form;

    // default to tab 0 when opening
    useEffect(() => {
        setSelectedTab(0);
    }, [isOpen]);
    return (
        <Dialog
            fullWidth
            maxWidth="lg"
            open={isOpen}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') {
                    onClose();
                }
            }}
            scroll="body"
            className={classes.mainModal}
        >
            <DialogTitle className={classes.title}>
                {selectedCampaign?.id ? 'Edit' : 'Create'} campaign
            </DialogTitle>
            <DialogContent className={classes.content}>
                <Tabs
                    value={selectedTab}
                    className={classes.tabs}
                    textColor="primary"
                    onChange={handleChange}
                    aria-label="disabled tabs example"
                >
                    {tabs.map(({ title }) => {
                        return <Tab key={title} label={title} />;
                    })}
                </Tabs>
                <FormikProvider value={formik}>
                    <Form>
                        <CurrentForm />
                    </Form>
                    <Grid container justifyContent="flex-end">
                        <Grid item md={6}>
                            {formik.errors.non_field_errors?.map(
                                (error_msg, i) => (
                                    <Typography key={i} color="error">
                                        {error_msg}
                                    </Typography>
                                ),
                            )}
                        </Grid>
                    </Grid>
                </FormikProvider>
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button
                    onClick={onClose}
                    color="primary"
                    disabled={formik.isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    onClick={formik.handleSubmit}
                    color="primary"
                    variant="contained"
                    autoFocus
                    disabled={!formik.isValid || formik.isSubmitting}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const SearchInput = ({ onChange }) => {
    const classes = useStyles();

    return (
        <FormControl fullWidth className={classes.margin} variant="outlined">
            <InputLabel
                htmlFor="search-campaigns"
                style={{ backgroundColor: 'white' }}
            >
                Search
            </InputLabel>
            <OutlinedInput
                id="search-campaigns"
                key="search-campaigns-key"
                startAdornment={
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                }
                onChange={onChange}
            />
        </FormControl>
    );
};

const PageActions = ({ onSearch, children }) => {
    const classes = useStyles();

    return (
        <Grid
            container
            className={classes.pageActions}
            spacing={4}
            justifyContent="flex-end"
            alignItems="center"
        >
            {onSearch && (
                <Grid item xs={8}>
                    <SearchInput onChange={onSearch} />
                </Grid>
            )}
            <Grid
                item
                xs={4}
                container
                justifyContent="flex-end"
                alignItems="center"
            >
                {children}
            </Grid>
        </Grid>
    );
};

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
    const classes = useStyles();

    return (
        <Dialog
            fullWidth
            open={isOpen}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') {
                    onClose();
                }
            }}
        >
            <DialogTitle className={classes.title}>
                Are you sure you want to delete this campaign?
            </DialogTitle>
            <DialogContent className={classes.content}>
                This operation cannot be undone
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button onClick={onClose} color="primary">
                    No
                </Button>
                <Button onClick={onConfirm} color="primary" autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-cvdpv2_notified_at';

export const Dashboard = () => {
    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
        useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState();
    const [page, setPage] = useState(parseInt(DEFAULT_PAGE, 10));
    const [pageSize, setPageSize] = useState(parseInt(DEFAULT_PAGE_SIZE, 10));
    const [searchQueryText, setSearchQuery] = useState(undefined);
    const [searchQuery] = useDebounce(searchQueryText, 500);
    const [order, setOrder] = useState(DEFAULT_ORDER);
    const classes = useStyles();

    const { query, exportToCSV } = useGetCampaigns({
        page,
        pageSize,
        order,
        searchQuery,
    });

    const { data: campaigns = [], status } = query;

    const { mutate: removeCampaign } = useRemoveCampaign();

    const selectedCampaign = campaigns?.campaigns?.find(
        campaign => campaign.id === selectedCampaignId,
    );

    const openCreateEditDialog = useCallback(() => {
        setIsCreateEditDialogOpen(true);
    }, [setIsCreateEditDialogOpen]);

    const closeCreateEditDialog = () => {
        setSelectedCampaignId(undefined);
        setIsCreateEditDialogOpen(false);
    };

    const openDeleteConfirmDialog = useCallback(() => {
        setIsConfirmDeleteDialogOpen(true);
    }, [setIsConfirmDeleteDialogOpen]);

    const closeDeleteConfirmDialog = () => {
        setIsConfirmDeleteDialogOpen(false);
    };

    const handleDeleteConfirmDialogConfirm = () => {
        removeCampaign(selectedCampaign.id, {
            onSuccess: () => {
                closeDeleteConfirmDialog();
            },
        });
    };

    const handleClickEditRow = useCallback(
        id => {
            setSelectedCampaignId(id);
            openCreateEditDialog();
        },
        [setSelectedCampaignId, openCreateEditDialog],
    );

    const handleClickDeleteRow = useCallback(
        id => {
            setSelectedCampaignId(id);
            openDeleteConfirmDialog();
        },
        [setSelectedCampaignId, openDeleteConfirmDialog],
    );

    const handleClickCreateButton = () => {
        setSelectedCampaignId(undefined);
        openCreateEditDialog();
    };

    const handleSearch = useCallback(event => {
        setSearchQuery(event.target.value);
    }, []);

    const columns = useMemo(
        () => [
            {
                Header: 'Country',
                accessor: 'top_level_org_unit_name',
                sortable: false,
            },
            {
                Header: 'Name',
                accessor: 'obr_name',
            },
            {
                Header: 'cVDPV2 notification date',
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: 'Round 1',
                id: 'round_one__started_at',
                accessor: row => row.round_one?.started_at,
            },
            {
                Header: 'Round 2',
                id: 'round_two__started_at',
                accessor: row => row.round_two?.started_at,
            },
            {
                Header: 'Status',
                sortable: false,
                accessor: 'general_status',
            },
            {
                Header: 'Actions',
                accessor: 'id',
                sortable: false,
                Cell: settings => (
                    <>
                        <IconButtonComponent
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                            onClick={() => handleClickEditRow(settings.value)}
                        />
                        <IconButtonComponent
                            icon="delete"
                            tooltipMessage={MESSAGES.delete}
                            onClick={() => handleClickDeleteRow(settings.value)}
                        />
                    </>
                ),
            },
        ],
        [handleClickDeleteRow, handleClickEditRow],
    );

    // The naming is aligned with the names in Table
    const onTableParamsChange = useCallback(
        (baseUrl, newParams) => {
            if (newParams.page !== page) {
                setPage(newParams.page);
            }
            if (newParams.pageSize !== pageSize) {
                setPageSize(newParams.pageSize);
            }
            if (newParams.order !== order) {
                setOrder(newParams.order);
            }
        },
        [page, pageSize, order],
    );

    const tableParams = useMemo(() => {
        return {
            pageSize,
            page,
            order,
        };
    }, [pageSize, page, order]);
    return (
        <>
            <TopBar title="Campaigns" displayBackButton={false} />
            <CreateEditDialog
                selectedCampaign={selectedCampaign}
                isOpen={isCreateEditDialogOpen}
                onClose={closeCreateEditDialog}
            />
            <DeleteConfirmDialog
                isOpen={isConfirmDeleteDialogOpen}
                onClose={closeDeleteConfirmDialog}
                onConfirm={handleDeleteConfirmDialogConfirm}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {status === 'loading' && <LoadingSpinner />}
                <PageActions onSearch={handleSearch}>
                    <PageAction
                        icon={AddIcon}
                        onClick={handleClickCreateButton}
                    >
                        Create
                    </PageAction>
                    <PageAction icon={DownloadIcon} onClick={exportToCSV}>
                        CSV
                    </PageAction>
                    <ImportLineListDialog
                        renderTrigger={({ openDialog }) => (
                            <PageAction
                                icon={CloudUploadIcon}
                                onClick={openDialog}
                            >
                                Import
                            </PageAction>
                        )}
                    />
                </PageActions>
                {status === 'success' && (
                    <Table
                        params={tableParams}
                        count={campaigns.count}
                        pages={Math.ceil(campaigns.count / pageSize)}
                        baseUrl="/polio"
                        redirectTo={onTableParamsChange}
                        columns={columns}
                        data={campaigns.campaigns}
                    />
                )}
            </Box>
        </>
    );
};
