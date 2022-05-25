import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import {
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@material-ui/core';
import isEqual from 'lodash/isEqual';
import Grid from '@material-ui/core/Grid';
import { get, merge } from 'lodash';
import { Field, FormikProvider, useFormik } from 'formik';
import * as yup from 'yup';
import Typography from '@material-ui/core/Typography';

import Form from './Form';
import TextInput from './TextInput';
import Rte from './Rte';
import RadioInput from './RadioInput';
import SelectInput from './SelectInput';
import { useSavePage } from '../hooks/useSavePage';
import { useGetProfiles } from '../../users/hooks/useGetProfiles';
import MESSAGES from '../messages';
import { PAGES_TYPES, IFRAME, TEXT, RAW } from '../constants';
import getDisplayName, { useCurrentUser } from '../../../utils/usersUtils';

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
    const { data } = useGetProfiles();
    const profiles = data ? data.profiles : [];

    const currentUser = useCurrentUser();
    const profilesList = profiles
        .filter(p => p.id !== currentUser.id)
        .map(p => ({
            value: p.user_id,
            label: getDisplayName(p),
        }));
    const classes = useStyles();
    const intl = useSafeIntl();

    const handleSubmit = (values, helpers) => {
        const tempValues = { ...values };
        const users = values.users || [];
        users.push(currentUser.user_id);
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
                    .required(intl.formatMessage(MESSAGES.nameRequired)),
                slug: yup
                    .string()
                    .trim()
                    .required(intl.formatMessage(MESSAGES.slugRequired)),
                content:
                    type === IFRAME
                        ? yup
                              .string()
                              .trim()
                              .url(intl.formatMessage(MESSAGES.urlNotValid))
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
    let contentLabel = intl.formatMessage(MESSAGES.rawHtml);
    let contentComponent = TextInput;
    if (type === IFRAME) {
        contentLabel = intl.formatMessage(MESSAGES.url);
        contentComponent = TextInput;
    }
    if (type === TEXT) {
        contentLabel = intl.formatMessage(MESSAGES.text);
        contentComponent = Rte;
    }
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
                {initialValues.id && intl.formatMessage(MESSAGES.editPage)}
                {!initialValues.id && intl.formatMessage(MESSAGES.createPage)}
            </DialogTitle>
            <DialogContent className={classes.content}>
                <FormikProvider value={formik}>
                    <Form>
                        <Grid container spacing={0}>
                            <Grid xs={12} item>
                                <Box mb={2}>
                                    <Typography>
                                        {intl.formatMessage(
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
                                            label={intl.formatMessage(
                                                MESSAGES.name,
                                            )}
                                            name="name"
                                            component={TextInput}
                                            className={classes.input}
                                        />
                                    </Grid>
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={intl.formatMessage(
                                                MESSAGES.slug,
                                            )}
                                            name="slug"
                                            component={TextInput}
                                            className={classes.input}
                                        />
                                    </Grid>
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={intl.formatMessage(
                                                MESSAGES.users,
                                            )}
                                            name="users"
                                            options={profilesList}
                                            component={SelectInput}
                                            className={classes.input}
                                        />
                                    </Grid>
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={intl.formatMessage(
                                                MESSAGES.needsAuthentication,
                                            )}
                                            name="needs_authentication"
                                            options={[
                                                {
                                                    value: true,
                                                    label: intl.formatMessage(
                                                        MESSAGES.yes,
                                                    ),
                                                },
                                                {
                                                    value: false,
                                                    label: intl.formatMessage(
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
                                            label={intl.formatMessage(
                                                MESSAGES.type,
                                            )}
                                            name="type"
                                            options={PAGES_TYPES.map(
                                                pageType => ({
                                                    value: pageType.value,
                                                    label: intl.formatMessage(
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
                            {intl.formatMessage(MESSAGES.cancel)}
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
                        {intl.formatMessage(MESSAGES.confirm)}
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
