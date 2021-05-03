import { useMemo } from 'react';
import { useTable } from 'react-table';

import {
    Box,
    makeStyles,
    IconButton,
    Grid,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Tabs,
    Tab,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
    FormControl,
} from '@material-ui/core';

import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';

import commonStyles from '../styles/common';

import { TableHeader } from './Table/TableHeader';
import { TableCell } from './Table/TableCell';

import { Page } from './Page';
import { useState } from 'react';

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
        marginTop: theme.spacing(8),
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

const TextInput = props => {
    return (
        <TextField
            displayEmpty
            InputLabelProps={{
                shrink: true,
            }}
            fullWidth
            variant={'outlined'}
            size={'medium'}
            {...props}
        />
    );
};

const ResponsibleField = () => {
    return (
        <FormControl fullWidth variant="outlined">
            <InputLabel id="responsible-label-id">Responsible</InputLabel>
            <Select
                label="Responsible"
                labelId="responsible-label-id"
                id="responsible-field-id"
            >
                <MenuItem value="WHO">WHO</MenuItem>
                <MenuItem value="UNICEF">UNICEF</MenuItem>
                <MenuItem value="NAT">National</MenuItem>
                <MenuItem value="MOH">MOH</MenuItem>
                <MenuItem value="PROV">PROVINCE</MenuItem>
                <MenuItem value="DIST">District</MenuItem>
            </Select>
        </FormControl>
    );
};

const StatusField = () => {
    return (
        <FormControl fullWidth variant="outlined">
            <InputLabel id="status-label-id">Status</InputLabel>
            <Select
                label="Status"
                labelId="status-label-id"
                id="status-field-id"
            >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="ONGOING">Ongoing</MenuItem>
                <MenuItem value="FINISHED">Finished</MenuItem>
            </Select>
        </FormControl>
    );
};

const PageAction = ({ icon: Icon, onClick }) => {
    const classes = useStyles();

    return (
        <Button variant="contained" color="primary" onClick={onClick}>
            <Icon className={classes.buttonIcon} />
            Create
        </Button>
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
                        <TextInput label="EPID" className={classes.input} />
                        <TextInput label="OBR Name" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl
                            className={classes.input}
                            fullWidth
                            variant="outlined"
                        >
                            <InputLabel id="virus-label-id">Virus</InputLabel>
                            <Select
                                label="Virus"
                                labelId="virus-label-id"
                                id="virus-field-id"
                            >
                                <MenuItem value="PV1">PV1</MenuItem>
                                <MenuItem>PV2</MenuItem>
                                <MenuItem>PV3</MenuItem>
                                <MenuItem>cVDPV2</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel id="virus-label-id">Vacines</InputLabel>
                            <Select
                                label="Vacines"
                                labelId="virus-label-id"
                                id="virus-field-id"
                            >
                                <MenuItem>mOPV2</MenuItem>
                                <MenuItem>nOPV2</MenuItem>
                                <MenuItem>bOPV</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextInput className={classes.input} label="Description" />
                    <TextInput className={classes.input} label="Country" />
                    <TextInput className={classes.input} label="Province" />
                    <TextInput label="Distrit" />
                </Grid>
                <Grid container item spacing={2}>
                    <Grid item xs={12} md={6}>
                        <DateInput label={'Date of onset'} fullWidth />
                        <DateInput label={'cVDPV Notifiation'} fullWidth />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DateInput label={'PV Notification'} fullWidth />
                        <DateInput label={'3 level call'} fullWidth />
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
                        <StatusField />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <ResponsibleField />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <DateInput label={'Date of onset'} fullWidth />
                    <DateInput label={'PV2 Notifiation'} fullWidth />
                    <DateInput label={'cVDPV2 Notifiation'} fullWidth />
                </Grid>
            </Grid>
        </>
    );
};
const RiskAssessmentForm = () => {
    const classes = useStyles();
    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <StatusField />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <ResponsibleField />
                    </Grid>
                </Grid>
                <Grid item md={6}>
                    <DateInput label={'Field Investigation Date'} fullWidth />
                    <DateInput label={'3 level call'} fullWidth />
                    <DateInput label={'1st Draft Submission'} fullWidth />
                    <DateInput label={'RRT/OPRTT Approval'} fullWidth />
                    <DateInput label={'AG/nOPV Group'} fullWidth />
                    <DateInput label={'DG Authorization'} fullWidth />
                    <TextInput
                        label="Target population Round 1"
                        className={classes.input}
                    />
                    <TextInput
                        label="Target population Round 2"
                        className={classes.input}
                    />
                    <Typography>Vials Requested (computed) 37400</Typography>
                </Grid>
            </Grid>
        </>
    );
};
const BudgetForm = () => {
    return <div>Budget</div>;
};

const DateInput = props => {
    const classes = useStyles();

    return (
        <TextField
            className={classes.input}
            displayEmpty
            id="date"
            type="date"
            InputLabelProps={{
                shrink: true,
            }}
            variant={'outlined'}
            size={'medium'}
            {...props}
        />
    );
};

const Round1Form = () => {
    const classes = useStyles();

    return (
        <>
            <DateInput label={'Round 1 Start'} />
            <DateInput label={'Round 1 End'} />
            <DateInput label={'Mop Up Start'} />
            <DateInput label={'Mop Up End'} />
            <Box className={classes.round1FormCalculations}>
                <Typography>
                    Percentage of districts passing LQAS: 96% (182 passing / 192
                    received / 200 total)
                </Typography>
                <Typography>Percentage of missed children: 10%</Typography>
            </Box>
            <DateInput label={'IM Start'} />
            <DateInput label={'IM End'} />
        </>
    );
};
const Round2Form = () => {
    const classes = useStyles();

    return (
        <>
            <DateInput label={'Round 2 Start'} />
            <DateInput label={'Round 2 End'} />
            <DateInput label={'Mop Up Start'} />
            <DateInput label={'Mop Up End'} />
            <Box className={classes.round1FormCalculations}>
                <Typography>
                    Percentage of districts passing LQAS: 96% (182 passing / 192
                    received / 200 total)
                </Typography>
                <Typography>Percentage of missed children: 10%</Typography>
            </Box>
            <DateInput label={'IM Start'} />
            <DateInput label={'IM End'} />
            <DateInput label={'LQAS Start'} />
            <DateInput label={'LQAS End'} />
        </>
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

const CreateDialog = ({ isOpen, onClose, onCancel, onConfirm }) => {
    const classes = useStyles();

    const steps = [
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

    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const CurrentForm = steps[value].form;

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
                    value={value}
                    className={classes.tabs}
                    textColor={'primary'}
                    onChange={handleChange}
                    aria-label="disabled tabs example"
                >
                    {steps.map(({ title }) => {
                        return <Tab label={title} />;
                    })}
                </Tabs>
                <Form>
                    <CurrentForm />
                </Form>
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button onClick={onCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="primary" autoFocus disabled>
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

export const Dashboard = () => {
    const classes = useStyles();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const data = useMemo(
        () => [
            {
                name: 'DRC-39DS-01-2021',
                notificationDate: '02-20-2021',
                status: 'Risk Assessment Required',
                duration: '4',
                actions: <RowAction icon={EditIcon} />,
            },
        ],
        [],
    );

    const columns = useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'name',
            },
            {
                Header: 'cVDPV2 Notification Date',
                accessor: 'notificationDate',
            },
            {
                Header: 'Status',
                accessor: 'status',
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

    const tableInstance = useTable({ columns, data });

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    return (
        <>
            <CreateDialog
                isOpen={isCreateDialogOpen}
                onCancel={() => setIsCreateDialogOpen(false)}
                onClose={() => setIsCreateDialogOpen(false)}
                onConfirm={() => console.log('confirm')}
            />
            <Page title={'Campaigns for DRC'}>
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <PageActions>
                        <PageAction
                            icon={AddIcon}
                            onClick={() => setIsCreateDialogOpen(true)}
                        />
                    </PageActions>
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
                            {rows.map(row => {
                                prepareRow(row);
                                return (
                                    <tr
                                        className={classes.tableRow}
                                        {...row.getRowProps()}
                                    >
                                        {row.cells.map(cell => {
                                            return (
                                                <TableCell
                                                    {...cell.getCellProps()}
                                                >
                                                    {cell.render('Cell')}
                                                </TableCell>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Box>
            </Page>
        </>
    );
};
