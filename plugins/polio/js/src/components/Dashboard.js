import { useMemo, useState } from 'react';
import { useTable } from 'react-table';

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    DialogTitle,
    Grid,
    makeStyles,
    Tab,
    Tabs,
    Typography,
} from '@material-ui/core';
import merge from 'lodash.merge';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';

import commonStyles from '../styles/common';

import { TableHeader } from './Table/TableHeader';
import { TableCell } from './Table/TableCell';

import {
    DateInput,
    ResponsibleField,
    Select,
    StatusField,
    TextInput,
} from './Inputs';

import { Page } from './Page';
import { Field, FormikProvider, useFormik, useFormikContext } from 'formik';
import * as yup from 'yup';
import { polioVacines, polioViruses } from '../constants/virus';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { OrgUnitsLevels } from './Inputs/OrgUnitsSelect';
import { useSaveCampaign } from '../hooks/useSaveCampaign';
import { useEffect } from 'react';
import { useRemoveCampaign } from '../hooks/useRemoveCampaign';

const round_shape = yup.object().shape({
    started_at: yup.date().nullable(),
    ended_at: yup.date().nullable(),
    mop_up_started_at: yup.date().nullable(),
    mop_up_ended_at: yup.date().nullable(),
    im_started_at: yup.date().nullable(),
    im_ended_at: yup.date().nullable(),
    lqas_started_at: yup.date().nullable(),
    lqas_ended_at: yup.date().nullable(),
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

    eomg: yup.date().nullable(),
    budget_submitted_at: yup.date().nullable(),
    district_count: yup.number().nullable().positive().integer(),
    no_regret_fund_amount: yup.number().nullable().positive().integer(),

    round_one: round_shape,
    round_two: round_shape,
});

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        flexGrow: 1,
    },
    table: {
        borderSpacing: 0,
        width: '100%',
        border: '1px solid rgba(0,0,0,0.1)',
    },
    tableHeader: {
        display: 'flex',
        boxShadow: '0 2px 15px 0 rgb(0 0 0 / 15%)',
    },
    tableRow: {
        display: 'flex',
    },
    pageActions: {
        marginBottom: theme.spacing(2),
    },
    form: {
        marginTop: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    round1FormCalculations: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(4),
    },
    input: {
        marginBottom: theme.spacing(2),
    },
    tabs: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    },
}));

const RowAction = ({ icon: Icon, onClick }) => {
    return (
        <IconButton onClick={onClick}>
            <Icon />
        </IconButton>
    );
};

const PageAction = ({ icon: Icon, onClick, children }) => {
    const classes = useStyles();

    return (
        <Button variant="contained" color="primary" onClick={onClick}>
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
                        name={'pv2_notified_at'}
                        component={DateInput}
                    />
                    <Field
                        label={'cVDPV2 Notifiation'}
                        fullWidth
                        name={'cvdpv2_notified_at'}
                        component={DateInput}
                    />
                </Grid>
            </Grid>
        </>
    );
};
const RiskAssessmentForm = () => {
    const classes = useStyles();
    const { values } = useFormikContext();

    const targetPopulationTotal =
        parseInt(defaultToZero(values?.round_one?.target_population ?? 0)) +
        parseInt(defaultToZero(values?.round_two?.target_population ?? 0));

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name={'risk_assessment_status'}
                            component={StatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name={'risk_assessment_responsible'}
                            component={ResponsibleField}
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
                    <Typography>
                        Vials Requested{' '}
                        {Number.isNaN(targetPopulationTotal)
                            ? 0
                            : targetPopulationTotal}
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
};

const BudgetForm = () => {
    const classes = useStyles();

    const { values } = useFormikContext();

    const totalCost =
        parseInt(defaultToZero(values?.round_one?.cost ?? 0)) *
        parseInt(defaultToZero(values?.round_one?.target_population ?? 0));

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field name={'budget_status'} component={StatusField} />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name={'budget_responsible'}
                            component={ResponsibleField}
                        />
                    </Grid>
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
                        Cost/Child: ${Number.isNaN(totalCost) ? 0 : totalCost}
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
                <Box className={classes.round1FormCalculations}>
                    <Typography>
                        Percentage of districts passing LQAS: xx% (xxx passing /
                        xxx received / xx total)
                    </Typography>
                    <Typography>Percentage of missed children: xx%</Typography>
                </Box>

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
                <Box className={classes.round1FormCalculations}>
                    <Typography>
                        Percentage of districts passing LQAS: xx% (xxx passing /
                        xxx received / xxx total)
                    </Typography>
                    <Typography>Percentage of missed children: xx%</Typography>
                </Box>

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
        saveCampaign(values, {
            onSuccess: () => {
                helpers.resetForm();
                onClose();
            },
        });

    const defaultValues = {
        round_one: {},
        round_two: {},
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
            title: 'Budget',
            form: BudgetForm,
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

const PageActions = ({ children }) => {
    const classes = useStyles();

    return (
        <Grid
            container
            className={classes.pageActions}
            spacing={4}
            justify="flex-end"
            alignItems="center"
        >
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

export const Dashboard = () => {
    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(
        false,
    );
    const [selectedCampaignId, setSelectedCampaignId] = useState();

    const classes = useStyles();

    const { data: campaigns = [], status } = useGetCampaigns();
    const { mutate: removeCampaign } = useRemoveCampaign();

    const openCreateEditDialog = () => {
        setIsCreateEditDialogOpen(true);
    };

    const closeCreateEditDialog = () => {
        setSelectedCampaignId(undefined);
        setIsCreateEditDialogOpen(false);
    };

    const openDeleteConfirmDialog = () => {
        setIsConfirmDeleteDialogOpen(true);
    };

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

    const handleClickEditRow = id => {
        setSelectedCampaignId(id);
        openCreateEditDialog();
    };

    const handleClickDeleteRow = id => {
        setSelectedCampaignId(id);
        openDeleteConfirmDialog();
    };

    const handleClickCreateButton = () => {
        setSelectedCampaignId(undefined);
        openCreateEditDialog();
    };

    const tableData = campaigns.map(campaign => ({
        ...campaign,
        actions: (
            <>
                <RowAction
                    icon={EditIcon}
                    onClick={() => handleClickEditRow(campaign.id)}
                />
                <RowAction
                    icon={DeleteIcon}
                    onClick={() => handleClickDeleteRow(campaign.id)}
                />
            </>
        ),
    }));

    const selectedCampaign = campaigns.find(
        campaign => campaign.id === selectedCampaignId,
    );

    const columns = useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'obr_name',
            },
            {
                Header: 'cVDPV2 Notification Date',
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: 'Status',
                accessor: 'detection_status',
            },
            {
                Header: 'Duration (days)',
                accessor: 'duration',
            },
            {
                Header: 'Actions',
                accessor: 'actions',
            },
        ],
        [],
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: tableData });

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
            <Page title={'Campaigns for DRC'}>
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <PageActions>
                        <PageAction
                            icon={AddIcon}
                            onClick={handleClickCreateButton}
                        >
                            Create
                        </PageAction>
                    </PageActions>
                    {status === 'success' && (
                        <table className={classes.table} {...getTableProps()}>
                            <thead>
                                {headerGroups.map(headerGroup => (
                                    <tr
                                        className={classes.tableHeader}
                                        {...headerGroup.getHeaderGroupProps()}
                                    >
                                        {headerGroup.headers.map(column => (
                                            <TableHeader
                                                {...column.getHeaderProps()}
                                            >
                                                {column.render('Header')}
                                            </TableHeader>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody {...getTableBodyProps()}>
                                {rows.length > 0 ? (
                                    rows.map((row, rowIndex) => {
                                        prepareRow(row);
                                        return (
                                            <tr
                                                className={classes.tableRow}
                                                {...row.getRowProps()}
                                            >
                                                {row.cells.map(cell => {
                                                    return (
                                                        <TableCell
                                                            isOdd={rowIndex % 2}
                                                            {...cell.getCellProps()}
                                                        >
                                                            {cell.render(
                                                                'Cell',
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <TableCell>
                                            no campaigns available
                                        </TableCell>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </Box>
            </Page>
        </>
    );
};
