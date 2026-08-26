import React, { FunctionComponent } from 'react';
import {
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { get, merge } from 'lodash';
import isEqual from 'lodash/isEqual';
import * as yup from 'yup';
import { useCurrentUser } from '../../../utils/usersUtils';
import {
    PAGES_TYPES,
    IFRAME,
    TEXT,
    RAW,
    SUPERSET,
    POWERBI,
} from '../constants';
import { useIsPowerBiConfigured } from '../hooks/useIsPowerBiConfigured';
import { useSavePage } from '../hooks/useSavePage';
import MESSAGES from '../messages';
import Form from './Form';
import RadioInput from './RadioInput';
import Rte from './Rte';
import TextInput from './TextInput';
import { UserRolesSelect } from './UserRolesSelect';
import { UsersSelect } from './UsersSelect';

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

type Props = {
    isOpen?: boolean;
    onClose?: () => void;
    selectedPage?: Record<string, any> | null; // keeping null in the typing as leftover from prop types. It can probably be removed
};
const CreateEditDialog: FunctionComponent<Props> = ({
    isOpen = false,
    onClose = () => {},
    selectedPage = null,
}) => {
    const { mutate: savePage } = useSavePage();
    const isPowerBiConfigured = useIsPowerBiConfigured();

    const classes: Record<string, string> = useStyles({});
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
    };
    if (!selectedPage) {
        defaultValues['needs_authentication'] = false;
    }
    const getSchema = () => {
        return yup.lazy(vals => {
            const type = get(vals, 'type');
            let content;
            if (type === IFRAME) {
                content = yup
                    .string()
                    .trim()
                    .url(formatMessage(MESSAGES.urlNotValid));
            } else if (type === SUPERSET || type === POWERBI) {
                content = yup.string().trim().nullable();
            } else {
                content = yup.string().trim();
            }
            return yup.object().shape({
                name: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.nameRequired)),
                slug: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.slugRequired)),
                content,
                superset_dashboard_id:
                    type === SUPERSET
                        ? yup
                              .string()
                              .trim()
                              .required(
                                  formatMessage(
                                      MESSAGES.supersetDashboardIdRequired,
                                  ),
                              )
                        : yup.string().trim().nullable(),
                powerbi_group_id:
                    type === POWERBI
                        ? yup
                              .string()
                              .trim()
                              .required(
                                  formatMessage(
                                      MESSAGES.powerbiGroupIdRequired,
                                  ),
                              )
                        : yup.string().trim().nullable(),
                powerbi_report_id:
                    type === POWERBI
                        ? yup
                              .string()
                              .trim()
                              .required(
                                  formatMessage(
                                      MESSAGES.powerbiReportIdRequired,
                                  ),
                              )
                        : yup.string().trim().nullable(),
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
    let contentComponent: FunctionComponent = TextInput;
    if (type === IFRAME) {
        contentLabel = formatMessage(MESSAGES.url);
        contentComponent = TextInput;
    }
    if (type === TEXT) {
        contentLabel = formatMessage(MESSAGES.text);
        contentComponent = Rte;
    }
    const isNewPage = !initialValues.id;
    // Only offer PowerBI as a type when it's configured, unless the page already uses it.
    const availablePagesTypes = PAGES_TYPES.filter(
        pageType =>
            pageType.value !== POWERBI ||
            isPowerBiConfigured ||
            type === POWERBI,
    );
    return (
        <Dialog
            fullWidth
            maxWidth="md"
            open={isOpen}
            onClose={(_, reason) => {
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
                                        />
                                    </Grid>
                                    <Grid xs={6} md={6} item>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES.userRoles,
                                            )}
                                            name="user_roles"
                                            component={UserRolesSelect}
                                            className={classes.input}
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
                                            options={availablePagesTypes.map(
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
                                        {type === SUPERSET && (
                                            <Field
                                                label={formatMessage(
                                                    MESSAGES.superset_dashboard_id,
                                                )}
                                                name="superset_dashboard_id"
                                                component={TextInput}
                                                className={classes.input}
                                            />
                                        )}
                                        {type === POWERBI && (
                                            <>
                                                <Field
                                                    label={formatMessage(
                                                        MESSAGES.powerbiGroupId,
                                                    )}
                                                    name="powerbi_group_id"
                                                    component={TextInput}
                                                    className={classes.input}
                                                />
                                                <Field
                                                    label={formatMessage(
                                                        MESSAGES.powerbiReportId,
                                                    )}
                                                    name="powerbi_report_id"
                                                    component={TextInput}
                                                    className={classes.input}
                                                />
                                            </>
                                        )}
                                        {type !== SUPERSET &&
                                            type !== POWERBI && (
                                                <Field
                                                    label={contentLabel}
                                                    name="content"
                                                    multiline={type === RAW}
                                                    component={contentComponent}
                                                    className={classes.input}
                                                />
                                            )}
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

export default CreateEditDialog;
