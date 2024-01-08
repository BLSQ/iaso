import React from 'react';
import PropTypes from 'prop-types';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import {
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
} from '@mui/material';
import isEqual from 'lodash/isEqual';
import { get, merge } from 'lodash';
import { Field, FormikProvider, useFormik } from 'formik';
import * as yup from 'yup';
import Typography from '@mui/material/Typography';

import Form from './Form';
import TextInput from './TextInput';
import Rte from './Rte';
import RadioInput from './RadioInput';
import { UsersSelect } from './UsersSelect.tsx';
import { useCurrentUser } from '../../../utils/usersUtils.ts';

import { useSavePage } from '../hooks/useSavePage';

import MESSAGES from '../messages';
import { PAGES_TYPES, IFRAME, TEXT, RAW } from '../constants';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    content: {
        ...commonStyles(theme).content,
        overflow: 'visible',
    },
    paper: {
        overflow: 'visible',
    },
}));

const CreateEditDialog = ({ isOpen, onClose, selectedPage }) => {
    const { mutate: savePage } = useSavePage();

    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    const handleSubmit = (values, helpers) => {
        const tempValues = { ...values };
        const users = values.users || [currentUser.user_id];
        tempValues.users = users;
        savePage(tempValues, {
            onSuccess: () => {
                onClose();
                helpers.resetForm();
            },
        });
    };

    const defaultValues = {
        type: selectedPage?.type ?? RAW,
        needs_authentication: !(selectedPage?.needs_authentication ?? false),
    };
    const getSchema = () => {
        return yup.lazy(vals => {
            const type = get(vals, 'type');
            return yup.object().shape({
                name: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.nameRequired)),
                slug: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.slugRequired)),
                content:
                    type === IFRAME
                        ? yup
                              .string()
                              .trim()
                              .url(formatMessage(MESSAGES.urlNotValid))
                        : yup.string().trim(),
                type: yup.string().trim().required(),
            });
        });
    };
    const initialValues = merge(selectedPage, defaultValues);
    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: getSchema,
        onSubmit: handleSubmit,
    });
    const isFormTouched = !isEqual(formik.initialValues, formik.values);
    const type = get(formik.values, 'type');
    let contentLabel = formatMessage(MESSAGES.rawHtml);
    let contentComponent = TextInput;
    if (type === IFRAME) {
        contentLabel = formatMessage(MESSAGES.url);
        contentComponent = TextInput;
    }
    if (type === TEXT) {
        contentLabel = formatMessage(MESSAGES.text);
        contentComponent = Rte;
    }
    const isNewPage = !initialValues.id;
    return (
        <Dialog
            fullWidth
            maxWidth="md"
            open={isOpen}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') {
                    onClose();
                }
            }}
            scroll="body"
            classes={{
                paper: classes.paper,
            }}
        >
            <DialogTitle className={classes.title}>
                {!isNewPage && formatMessage(MESSAGES.editPage)}
                {isNewPage && formatMessage(MESSAGES.createPage)}
            </DialogTitle>
            <DialogContent className={classes.content}>
                <FormikProvider value={formik}>
                    <Form>
                        <Grid container spacing={0}>
                            <Grid xs={12} item>
                                <Box mb={2}>
                                    <Typography>
                                        {formatMessage(
                                            MESSAGES.pageDialiogHelper,
                                        )}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid container direction="row" item spacing={2}>
                                <Grid
                                    xs={12}
                                    md={12}
                                    item
                                    container
                                    spacing={2}
                                >
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={formatMessage(MESSAGES.name)}
                                            name="name"
                                            component={TextInput}
                                            className={classes.input}
                                        />
                                    </Grid>
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={formatMessage(MESSAGES.slug)}
                                            name="slug"
                                            component={TextInput}
                                            className={classes.input}
                                        />
                                    </Grid>
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES.users,
                                            )}
                                            name="users"
                                            component={UsersSelect}
                                            isNewPage={isNewPage}
                                            className={classes.input}
                                            managedUsersOnly="false"
                                        />
                                    </Grid>
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES.needsAuthentication,
                                            )}
                                            name="needs_authentication"
                                            options={[
                                                {
                                                    value: true,
                                                    label: formatMessage(
                                                        MESSAGES.yes,
                                                    ),
                                                },
                                                {
                                                    value: false,
                                                    label: formatMessage(
                                                        MESSAGES.no,
                                                    ),
                                                },
                                            ]}
                                            onChange={(newValue, form) => {
                                                form.setFieldValue(
                                                    'needs_authentication',
                                                    newValue === 'true',
                                                );
                                            }}
                                            component={RadioInput}
                                            className={classes.input}
                                        />
                                    </Grid>
                                    <Grid xs={12} md={12} item>
                                        <Field
                                            label={formatMessage(MESSAGES.type)}
                                            name="type"
                                            options={PAGES_TYPES.map(
                                                pageType => ({
                                                    value: pageType.value,
                                                    label: formatMessage(
                                                        pageType.label,
                                                    ),
                                                }),
                                            )}
                                            onChange={(newValue, form) => {
                                                form.setFieldValue(
                                                    'type',
                                                    newValue,
                                                );
                                                if (newValue === IFRAME) {
                                                    form.setFieldValue(
                                                        'content',
                                                        '',
                                                    );
                                                }
                                            }}
                                            component={RadioInput}
                                            className={classes.input}
                                        />
                                    </Grid>
                                    <Grid xs={12} md={12} item>
                                        <Field
                                            label={contentLabel}
                                            name="content"
                                            multiline={type === RAW}
                                            component={contentComponent}
                                            className={classes.input}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Form>
                </FormikProvider>
            </DialogContent>
            <DialogActions className={classes.action}>
                <Box m={2}>
                    <Box mr={1} display="inline">
                        <Button
                            onClick={onClose}
                            color="primary"
                            disabled={formik.isSubmitting}
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                    </Box>
                    <Button
                        onClick={formik.handleSubmit}
                        color="primary"
                        autoFocus
                        disabled={
                            !isFormTouched ||
                            !formik.isValid ||
                            formik.isSubmitting
                        }
                    >
                        {formatMessage(MESSAGES.confirm)}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

CreateEditDialog.defaultProps = {
    isOpen: false,
    onClose: () => null,
    selectedPage: null,
};

CreateEditDialog.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    selectedPage: PropTypes.object,
};

export default CreateEditDialog;
