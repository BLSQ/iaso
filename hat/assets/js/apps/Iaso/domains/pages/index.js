import React, { useCallback, useMemo, useState } from 'react';
import {
    Table,
    LoadingSpinner,
    useSafeIntl,
    commonStyles,
    IconButton as IconButtonComponent,
    ColumnText,
} from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import {
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@material-ui/core';
import moment from 'moment';
import AddIcon from '@material-ui/icons/Add';
import Grid from '@material-ui/core/Grid';
import merge from 'lodash.merge';
import get from 'lodash.get';
import { Field, FormikProvider, useFormik } from 'formik';
import * as yup from 'yup';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from '../forms/messages';
import { useGetPages } from './useGetPages';
import { useSavePage } from './useSavePage';
import { useRemovePage } from './useRemovePage';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const schema = yup.object().shape({
    name: yup.string().trim().required(),
    slug: yup.string().trim().required(),
    content: yup.string().url().trim().required(),
});

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

export const TextInput = ({ field = {}, form = {}, ...props } = {}) => {
    return (
        <TextField
            InputLabelProps={{
                shrink: true,
            }}
            fullWidth
            variant="outlined"
            size="medium"
            {...props}
            {...field}
            error={form.errors && Boolean(get(form.errors, field.name))}
            helperText={form.errors && get(form.errors, field.name)}
        />
    );
};

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
    const classes = useStyles();

    return (
        <Dialog fullWidth open={isOpen} onBackdropClick={onClose}>
            <DialogTitle className={classes.title}>
                Are you sure you want to delete this page?
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

const CreateEditDialog = ({ isOpen, onClose, selectedPage }) => {
    const { mutate: savePage } = useSavePage();

    const classes = useStyles();

    const handleSubmit = (values, helpers) =>
        savePage(values, {
            onSuccess: () => {
                helpers.resetForm();
                onClose();
            },
        });

    const defaultValues = {};

    const initialValues = merge(selectedPage, defaultValues);

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: handleSubmit,
    });

    return (
        <Dialog
            fullWidth
            maxWidth="lg"
            open={isOpen}
            onBackdropClick={onClose}
            scroll="body"
        >
            <DialogTitle className={classes.title}>Create Page</DialogTitle>
            <DialogContent className={classes.content}>
                <FormikProvider value={formik}>
                    <Form>
                        <Grid container spacing={2}>
                            <Grid xs={12} item>
                                <Typography>Enter page information</Typography>
                            </Grid>
                            <Grid container direction="row" item spacing={2}>
                                <Grid xs={12} md={12} item>
                                    <Field
                                        label="Name"
                                        name="name"
                                        component={TextInput}
                                        className={classes.input}
                                    />
                                </Grid>
                                <Grid xs={12} md={12} item>
                                    <Field
                                        label="Slug"
                                        name="slug"
                                        component={TextInput}
                                        className={classes.input}
                                    />
                                </Grid>
                                <Grid xs={12} md={12} item>
                                    <Field
                                        label="Url"
                                        name="content"
                                        component={TextInput}
                                        className={classes.input}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
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

const Pages = () => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const [page, setPage] = useState(parseInt(DEFAULT_PAGE, 10));
    const [pageSize, setPageSize] = useState(parseInt(DEFAULT_PAGE_SIZE, 10));
    const [selectedPageId, setSelectedPageId] = useState();
    const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
        useState(false);

    const openCreateEditDialog = useCallback(() => {
        setIsCreateEditDialogOpen(true);
    }, [setIsCreateEditDialogOpen]);

    const handleClickCreateButton = () => {
        setSelectedPageId(undefined);
        openCreateEditDialog();
    };

    const handleClickEditRow = useCallback(
        id => {
            setSelectedPageId(id);
            openCreateEditDialog();
        },
        [setSelectedPageId, openCreateEditDialog],
    );

    const closeCreateEditDialog = () => {
        setSelectedPageId(undefined);
        setIsCreateEditDialogOpen(false);
    };

    const closeDeleteConfirmDialog = () => {
        setIsConfirmDeleteDialogOpen(false);
    };

    const { mutate: removePage } = useRemovePage();

    const openDeleteConfirmDialog = useCallback(() => {
        setIsConfirmDeleteDialogOpen(true);
    }, [setIsConfirmDeleteDialogOpen]);

    const handleClickDeleteRow = useCallback(
        id => {
            setSelectedPageId(id);
            openDeleteConfirmDialog();
        },
        [setSelectedPageId, openDeleteConfirmDialog],
    );

    const { query } = useGetPages({
        page,
        pageSize,
    });

    const { data: pages = [], status } = query;

    const selectedPage = pages?.results?.find(
        result => result.id === selectedPageId,
    );

    const handleDeleteConfirmDialogConfirm = () => {
        removePage(selectedPage.id, {
            onSuccess: () => {
                closeDeleteConfirmDialog();
            },
        });
    };

    const columns = useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'name',
                Cell: settings => {
                    return <span>{settings.original.name}</span>;
                },
            },
            {
                Header: 'Slug',
                accessor: 'slug',
                Cell: settings => {
                    return <span>{settings.original.slug}</span>;
                },
            },
            {
                Header: 'Last update',
                accessor: 'updated_at',
                Cell: settings => {
                    return (
                        <ColumnText
                            text={moment(settings.original.updated_at).format(
                                'DD/MM/YYYY HH:mm',
                            )}
                        />
                    );
                },
            },
            {
                Header: 'Actions',
                Cell: settings => {
                    return (
                        <>
                            <Link to={`/pages/${settings.original.slug}`}>
                                <IconButtonComponent
                                    icon="remove-red-eye"
                                    tooltipMessage={MESSAGES.viewPage}
                                    onClick={() => {}}
                                />
                            </Link>
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
        },
        [page, pageSize],
    );

    const tableParams = useMemo(() => {
        return {
            pageSize,
            page,
        };
    }, [pageSize, page]);

    return (
        <>
            <CreateEditDialog
                selectedPage={selectedPage}
                isOpen={isCreateEditDialogOpen}
                onClose={closeCreateEditDialog}
            />
            <DeleteConfirmDialog
                isOpen={isConfirmDeleteDialogOpen}
                onClose={closeDeleteConfirmDialog}
                onConfirm={handleDeleteConfirmDialogConfirm}
            />
            <TopBar title={intl.formatMessage(MESSAGES.title)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {status === 'loading' && <LoadingSpinner />}
                <PageActions>
                    <PageAction
                        icon={AddIcon}
                        onClick={handleClickCreateButton}
                    >
                        Create
                    </PageAction>
                </PageActions>
                {status === 'success' && (
                    <Table
                        params={tableParams}
                        count={pages.count}
                        pages={Math.ceil(pages.count / pageSize)}
                        baseUrl="/polio"
                        redirectTo={onTableParamsChange}
                        columns={columns}
                        data={pages.results}
                        watchToRender={tableParams}
                    />
                )}
            </Box>
        </>
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

export default Pages;
