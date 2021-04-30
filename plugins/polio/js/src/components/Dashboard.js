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
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';

import commonStyles from '../styles/common';

import { TableHeader } from './Table/TableHeader';
import { TableCell } from './Table/TableCell';
import { Layout } from './Layout';
import { useState } from 'react';

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
            <Dialog
                fullWidth
                maxWidth={'sm'}
                open={isCreateDialogOpen}
                classes={{
                    paper: classes.paper,
                }}
                onBackdropClick={() => setIsCreateDialogOpen(false)}
                scroll="body"
            >
                <DialogTitle className={classes.title}>title</DialogTitle>
                <DialogContent className={classes.content}>
                    Lorem ipsum
                </DialogContent>
            </Dialog>
            <Layout title={'Campaigns for DRC'}>
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Grid
                        container
                        className={classes.pageActions}
                        spacing={4}
                        justify="flex-end"
                        alignItems="center"
                    >
                        <Grid
                            item
                            xs={4}
                            container
                            justify="flex-end"
                            alignItems="center"
                        >
                            <PageAction
                                icon={AddIcon}
                                onClick={() => setIsCreateDialogOpen(true)}
                            />
                        </Grid>
                    </Grid>
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
            </Layout>
        </>
    );
};
