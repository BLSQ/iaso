import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Table,
    textPlaceholder,
    IconButton as IconButtonComponent,
    ColumnText,
    LoadingSpinner,
} from 'bluesquare-components';
import 'react-table/react-table.css';
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
} from '@material-ui/core';
import merge from 'lodash.merge';
import AddIcon from '@material-ui/icons/Add';
import DownloadIcon from '@material-ui/icons/GetApp';
import Delete from '@material-ui/icons/Delete';

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

import { Page } from './Page';
import { Field, FormikProvider, useFormik, useFormikContext } from 'formik';
import * as yup from 'yup';
import { polioVacines, polioViruses } from '../constants/virus';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { OrgUnitsLevels } from './Inputs/OrgUnitsSelect';
import { useSaveCampaign } from '../hooks/useSaveCampaign';
import { useRemoveCampaign } from '../hooks/useRemoveCampaign';
import { useStyles } from '../styles/theme';
import { PreparednessForm } from '../forms/PreparednessForm';
import { useGetRegionGeoJson } from '../hooks/useGetRegionGeoJson';
import MESSAGES from '../constants/messages';
import SearchIcon from '@material-ui/icons/Search';
import { useDebounce } from 'use-debounce';
import { convertEmptyStringToNull } from '../utils/convertEmptyStringToNull';

const round_shape = yup.object().shape({
    started_at: yup.date().nullable(),
    ended_at: yup
        .date()
        .nullable()
        .min(yup.ref('started_at'), "end date can't be before start date"),
    mop_up_started_at: yup.date().nullable(),
    mop_up_ended_at: yup
        .date()
        .nullable()
        .min(
            yup.ref('mop_up_started_at'),
            "end date can't be before start date",
        ),
    im_started_at: yup.date().nullable(),
    im_ended_at: yup
        .date()
        .nullable()
        .min(yup.ref('im_started_at'), "end date can't be before start date"),
    lqas_started_at: yup.date().nullable(),
    lqas_ended_at: yup
        .date()
        .nullable()
        .min(yup.ref('lqas_started_at'), "end date can't be before start date"),
    target_population: yup.number().nullable().min(0).integer(),
    cost: yup.number().nullable().min(0).integer(),
});

const schema = yup.object().shape({
    epid: yup.string().nullable(),
    obr_name: yup.string().trim().required(),
    description: yup.string().nullable(),
    onset_at: yup.date().nullable(),
    three_level_call_at: yup.date().nullable(),

    cvdpv_notified_at: yup.date().nullable(),
    cvdpv2_notified_at: yup.date().nullable(),

    pv_notified_at: yup.date().nullable(),
    pv2_notified_at: yup.date().nullable(),

    detection_first_draft_submitted_at: yup.date().nullable(),
    detection_rrt_oprtt_approval_at: yup.date().nullable(),

    investigation_at: yup.date().nullable(),
    risk_assessment_first_draft_submitted_at: yup.date().nullable(),
    risk_assessment_rrt_oprtt_approval_at: yup.date().nullable(),
    ag_nopv_group_met_at: yup.date().nullable(),
    dg_authorized_at: yup.date().nullable(),

    spreadsheet_url: yup.string().url().nullable(),

    eomg: yup.date().nullable(),
    budget_submitted_at: yup.date().nullable(),
    district_count: yup.number().nullable().positive().integer(),
    no_regret_fund_amount: yup.number().nullable().positive().integer(),

    round_one: round_shape,
    round_two: round_shape,
});

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
                            name={'epid'}
                            component={TextInput}
                            className={classes.input}
                        />

                        <Field
                            label="OBR Name"
                            name={'obr_name'}
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
                        name={'description'}
                        component={TextInput}
                    />
                    <Field
                        className={classes.input}
                        label="GPEI Coordinator"
                        name={'gpei_coordinator'}
                        component={TextInput}
                    />
                    <Field
                        className={classes.input}
                        label="GPEI Email"
                        name={'gpei_email'}
                        component={TextInput}
                    />
                    <Field
                        className={classes.input}
                        name={'initial_org_unit'}
                        component={OrgUnitsLevels}
                    />
                </Grid>
                <Grid container item spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Field
                            className={classes.input}
                            label={'Date of onset'}
                            fullWidth
                            name={'onset_at'}
                            component={DateInput}
                        />
                        <Field
                            className={classes.input}
                            label={'cVDPV Notifiation'}
                            fullWidth
                            name={'cvdpv_notified_at'}
                            component={DateInput}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Field
                            className={classes.input}
                            label={'PV Notification'}
                            fullWidth
                            name={'pv_notified_at'}
                            component={DateInput}
                        />
                        <Field
                            className={classes.input}
                            label={'3 level call'}
                            fullWidth
                            name={'three_level_call_at'}
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
                            name={'detection_status'}
                            component={StatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name={'detection_responsible'}
                            component={ResponsibleField}
                        />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <Field
                        label={'Date of onset'}
                        fullWidth
                        name={'onset_at'}
                        component={DateInput}
                    />

                    <Field
                        label={'PV2 Notification'}
                        fullWidth
                        name={'pv_notified_at'}
                        component={DateInput}
                    />
                    <Field
                        label={'cVDPV2 Notification'}
                        fullWidth
                        name={'cvdpv_notified_at'}
                        component={DateInput}
                    />
                </Grid>
            </Grid>
        </>
    );
};

const selectedPathOptions = { color: 'lime' };
const unselectedPathOptions = { color: 'gray' };
const initialDistrict = { color: '#FF695C' };

const RiskAssessmentForm = () => {
    const classes = useStyles();
    useFormikContext();

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name={'risk_assessment_status'}
                            component={RABudgetStatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name={'risk_assessment_responsible'}
                            component={ResponsibleField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            label="Verification Score (/20)"
                            name={'verification_score'}
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <Field
                        label={'Field Investigation Date'}
                        name={'investigation_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'3 level call'}
                        name={'three_level_call_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'1st Draft Submission'}
                        name={'risk_assessment_first_draft_submitted_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'RRT/OPRTT Approval'}
                        name={'risk_assessment_rrt_oprtt_approval_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'AG/nOPV Group'}
                        name={'ag_nopv_group_met_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'DG Authorization'}
                        name={'dg_authorized_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label="Target population Round 1"
                        name={'round_one.target_population'}
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label="Target population Round 2"
                        name={'round_two.target_population'}
                        component={TextInput}
                        className={classes.input}
                    />
                    <Field
                        label="Doses Requested (both rounds)"
                        name={'doses_requested'}
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

const ScopeForm = () => {
    const [selectRegion, setSelectRegion] = useState(false);
    const { values, setFieldValue } = useFormikContext();
    // Group contains selected orgunits
    const { group = { org_units: [] }, initial_org_unit } = values;

    const { data: shapes, isFetching } = useGetRegionGeoJson(
        values.org_unit?.country_parent?.id ||
            values.org_unit?.root?.id ||
            values.org_unit?.id,
    );

    const toggleRegionSelect = () => {
        setSelectRegion(!selectRegion);
    };

    const getShapeStyle = useCallback(
        shape => {
            return group.org_units.includes(shape.id)
                ? selectedPathOptions
                : values.org_unit?.id === shape.id
                ? initialDistrict
                : unselectedPathOptions;
        },
        [group, values.org_unit?.id],
    );

    const onSelectOrgUnit = useCallback(
        shape => {
            const { org_units } = group;
            let newOrgUnits;
            if (selectRegion) {
                const regionShapes = shapes
                    .filter(s => s.parent_id === shape.parent_id)
                    .map(s => s.id);
                const { selected, unselected } = separate(
                    regionShapes,
                    org_units,
                );
                const isRegionSelected =
                    selected.length === regionShapes.length;
                if (isRegionSelected) {
                    newOrgUnits = org_units.filter(
                        orgUnit => !regionShapes.includes(orgUnit),
                    );
                } else {
                    newOrgUnits = [...org_units, ...unselected];
                }
            } else {
                if (org_units.find(org_unit => shape.id === org_unit)) {
                    newOrgUnits = org_units.filter(
                        orgUnit => orgUnit !== shape.id,
                    );
                } else {
                    newOrgUnits = [...org_units, shape.id];
                }
            }

            setFieldValue('group', {
                ...group,
                org_units: newOrgUnits,
            });
        },
        [group, setFieldValue, selectRegion, shapes],
    );

    return (
        <Grid container spacing={4}>
            <Grid xs={9} item>
                {isFetching && !shapes && <LoadingSpinner />}
                {!isFetching && !shapes && (
                    // FIXME should not be needed
                    <Typography>
                        Please save the Campaign before selecting scope.
                    </Typography>
                )}
                <MapComponent
                    shapes={shapes}
                    onSelectShape={onSelectOrgUnit}
                    getShapeStyle={getShapeStyle}
                />
            </Grid>
            <Grid xs={3} item>
                <ul>
                    {shapes &&
                        shapes
                            .filter(shape => group.org_units.includes(shape.id))
                            .map(shape => (
                                <li key={shape.id}>
                                    <Typography>
                                        {shape.name}{' '}
                                        <Delete
                                            onClick={() =>
                                                onSelectOrgUnit(shape)
                                            }
                                        />
                                    </Typography>
                                </li>
                            ))}
                </ul>
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
                    {shapes && isFetching && (
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

    const round1Cost = parseInt(defaultToZero(values?.round_one?.cost ?? 0));
    const round2Cost = parseInt(defaultToZero(values?.round_two?.cost ?? 0));

    const round1Population = parseInt(
        defaultToZero(values?.round_one?.target_population ?? 0),
    );
    const round2Population = parseInt(
        defaultToZero(values?.round_two?.target_population ?? 0),
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
                            name={'budget_status'}
                            component={RABudgetStatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name={'budget_responsible'}
                            component={ResponsibleField}
                        />
                    </Grid>
                </Grid>

                <Grid xs={12} md={6} item>
                    <Box mb={2}>
                        <Field
                            name={'payment_mode'}
                            component={PaymentField}
                            fullWidth
                        />
                    </Box>
                    <Field
                        label={'Disbursed to CO (WHO)'}
                        name={'who_disbursed_to_co_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'Disbursed to MOH (WHO)'}
                        name={'who_disbursed_to_moh_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'Disbursed to CO (UNICEF)'}
                        name={'unicef_disbursed_to_co_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'Disbursed to MOH (UNICEF)'}
                        name={'unicef_disbursed_to_moh_at'}
                        component={DateInput}
                        fullWidth
                    />
                </Grid>

                <Grid item md={6}>
                    <Field
                        label={'1st Draft Submission'}
                        name={'risk_assessment_first_draft_submitted_at'}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={'RRT/OPRTT Approval'}
                        name={'risk_assessment_rrt_oprtt_approval_at'}
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={'EOMG Group'}
                        name={'eomg'}
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={'Budget Submitted At'}
                        name={'budget_submitted_at'}
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label="District Count"
                        name={'district_count'}
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label="No Regret Fund"
                        name={'no_regret_fund_amount'}
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label="Cost Round 1"
                        name={'round_one.cost'}
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label="Cost Round 2"
                        name={'round_two.cost'}
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
                    label={'Round 1 Start'}
                    name={'round_one.started_at'}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={'Round 1 End'}
                    name={'round_one.ended_at'}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={'Mop Up Start'}
                    name={'round_one.mop_up_started_at'}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={'Mop Up End'}
                    name={'round_one.mop_up_ended_at'}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={'IM Start'}
                    name={'round_one.im_started_at'}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={'IM End'}
                    name={'round_one.im_ended_at'}
                    component={DateInput}
                    fullWidth
                />
            </Grid>
            <Grid xs={12} md={6} item>
                <Field
                    label={'LQAS Start'}
                    name={'round_one.lqas_started_at'}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={'LQAS End'}
                    name={'round_one.lqas_ended_at'}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Districts passing LQAS"
                    name={'round_one.lqas_district_passing'}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Districts failing LQAS"
                    name={'round_one.lqas_district_failing'}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Main reason for non-vaccination"
                    name={'round_one.main_awareness_problem'}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN household"
                    name={
                        'round_one.im_percentage_children_missed_in_household'
                    }
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed OUT OF household"
                    name={
                        'round_one.im_percentage_children_missed_out_household'
                    }
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN+OUT OF household"
                    name={
                        'round_one.im_percentage_children_missed_in_plus_out_household'
                    }
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Awareness of campaign planning (%)"
                    name={'round_one.awareness_of_campaign_planning'}
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
                    label={'Round 2 Start'}
                    name={'round_two.started_at'}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={'Round 2 End'}
                    name={'round_two.ended_at'}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={'Mop Up Start'}
                    name={'round_two.mop_up_started_at'}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={'Mop Up End'}
                    name={'round_two.mop_up_ended_at'}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label={'IM Start'}
                    name={'round_two.im_started_at'}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={'IM End'}
                    name={'round_two.im_ended_at'}
                    component={DateInput}
                    fullWidth
                />
            </Grid>
            <Grid xs={12} md={6} item>
                <Field
                    label={'LQAS Start'}
                    name={'round_two.lqas_started_at'}
                    component={DateInput}
                    fullWidth
                />

                <Field
                    label={'LQAS End'}
                    name={'round_two.lqas_ended_at'}
                    component={DateInput}
                    fullWidth
                />
                <Field
                    label="Districts passing LQAS"
                    name={'round_two.lqas_district_passing'}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Districts failing LQAS"
                    name={'round_two.lqas_district_failing'}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Main reason for non-vaccination"
                    name={'round_two.main_awareness_problem'}
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN household"
                    name={
                        'round_two.im_percentage_children_missed_in_household'
                    }
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed OUT OF household"
                    name={
                        'round_two.im_percentage_children_missed_out_household'
                    }
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="% children missed IN+OUT OF household"
                    name={
                        'round_two.im_percentage_children_missed_in_plus_out_household'
                    }
                    component={TextInput}
                    className={classes.input}
                />
                <Field
                    label="Awareness of campaign planning (%)"
                    name={'round_two.awareness_of_campaign_planning'}
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

const CreateEditDialog = ({ isOpen, onClose, onConfirm, selectedCampaign }) => {
    const { mutate: saveCampaign } = useSaveCampaign();

    const classes = useStyles();

    const handleSubmit = (values, helpers) =>
        saveCampaign(convertEmptyStringToNull(values), {
            onSuccess: () => {
                helpers.resetForm();
                onClose();
            },
        });

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
            maxWidth={'lg'}
            open={isOpen}
            onBackdropClick={onClose}
            scroll="body"
        >
            <DialogTitle className={classes.title}>Create campaign</DialogTitle>
            <DialogContent className={classes.content}>
                <Tabs
                    value={selectedTab}
                    className={classes.tabs}
                    textColor={'primary'}
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
                    variant={'contained'}
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
            <InputLabel htmlFor="search-campaigns">Search</InputLabel>
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
            justify="flex-end"
            alignItems="center"
        >
            {onSearch && (
                <Grid item xs={8}>
                    <SearchInput onChange={onSearch} />
                </Grid>
            )}
            <Grid item xs={4} container justify="flex-end" alignItems="center">
                {children}
            </Grid>
        </Grid>
    );
};

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
    const classes = useStyles();

    return (
        <Dialog fullWidth open={isOpen} onBackdropClick={onClose}>
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

    const selectedCampaign = campaigns?.campaigns?.find(
        campaign => campaign.id === selectedCampaignId,
    );

    const columns = useMemo(
        () => [
            {
                Header: 'Country',
                accessor: 'top_level_org_unit_name',
                sortable: false,
                Cell: settings => {
                    const text =
                        settings?.original?.top_level_org_unit_name ??
                        textPlaceholder;
                    return <span>{text}</span>;
                },
            },
            {
                Header: 'Name',
                accessor: 'obr_name',
                Cell: settings => {
                    return <span>{settings.original.obr_name}</span>;
                },
            },
            {
                Header: 'cVDPV2 Notification Date',
                accessor: 'cvdpv2_notified_at',
                Cell: settings => {
                    const text =
                        settings?.original?.cvdpv2_notified_at ??
                        textPlaceholder;
                    return <span>{text}</span>;
                },
            },
            {
                Header: 'Round 1',
                accessor: 'round_one__started_at',
                Cell: settings => {
                    return (
                        <ColumnText
                            text={
                                settings.original?.round_one?.started_at ??
                                textPlaceholder
                            }
                        />
                    );
                },
            },
            {
                Header: 'Round 2',
                accessor: 'round_two__started_at',
                Cell: settings => {
                    return (
                        <ColumnText
                            text={
                                settings.original?.round_two?.started_at ??
                                textPlaceholder
                            }
                        />
                    );
                },
            },
            {
                Header: 'Status',
                sortable: false,
                accessor: 'general_status',
                Cell: settings => {
                    return (
                        <ColumnText text={settings.original.general_status} />
                    );
                },
            },
            {
                Header: 'Actions',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <IconButtonComponent
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                                onClick={() =>
                                    handleClickEditRow(settings.original.id)
                                }
                            />
                            <IconButtonComponent
                                icon="delete"
                                tooltipMessage={MESSAGES.delete}
                                onClick={() =>
                                    handleClickDeleteRow(settings.original.id)
                                }
                            />
                        </>
                    );
                },
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
            <Page title={'Campaigns'}>
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
                    </PageActions>
                    {status === 'success' && (
                        <Table
                            params={tableParams}
                            count={campaigns.count}
                            pages={Math.ceil(campaigns.count / pageSize)}
                            baseUrl={'/polio'}
                            redirectTo={onTableParamsChange}
                            columns={columns}
                            data={campaigns.campaigns}
                            watchToRender={tableParams}
                        />
                    )}
                </Box>
            </Page>
        </>
    );
};
