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
} from '@material-ui/core';

import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';

import commonStyles from '../styles/common';

import { TableHeader } from './Table/TableHeader';
import { TableCell } from './Table/TableCell';

import { Page } from './Page';
import { useState } from 'react';
import { useEffect } from 'react';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
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
        marginBottom: 16,
    },
}));

const RowAction = ({ icon: Icon, onClick }) => {
    return (
        <IconButton onClick={onClick}>
            <Icon />
        </IconButton>
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

const CreateDialog = ({ isOpen, onClose, onCancel, onConfirm }) => {
    const classes = useStyles();

    const steps = [
        'Base info',
        'Detection',
        'Risk Assessment',
        'Budget',
        'Preparedness',
        'Round 1',
        'Round 2',
    ];

    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

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
                    textColor={'primary'}
                    onChange={handleChange}
                    aria-label="disabled tabs example"
                >
                    {steps.map(step => (
                        <Tab label={step} />
                    ))}
                </Tabs>
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
