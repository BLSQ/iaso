import React from 'react';
import { useFormik, FormikProvider } from 'formik';
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import isEqual from 'lodash/isEqual';

import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { useGetTypes } from '../hooks/useGetTypes';

import MESSAGES from '../messages';

const useStyles = makeStyles(() => ({
    root: {
        minHeight: 365,
        position: 'relative',
    },
}));

const Dialog = ({ titleMessage, renderTrigger, initialData, saveEntity }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    const { data: entityTypes, isFetching: fetchingEntitytypes } =
        useGetTypes();

    const getSchema = () =>
        yup.lazy(() =>
            yup.object().shape({
                name: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.nameRequired)),
                entity_type: yup.string().trim().required(),
            }),
        );

    const formik = useFormik({
        initialValues: initialData || {
            name: null,
            entity_type: null,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: getSchema,
        onSubmit: saveEntity,
    });
    const { values, setFieldValue, errors, isValid, initialValues } = formik;

    const getErrors = k => (errors[k] ? [errors[k]] : []);

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={formik.handleSubmit}
                onCancel={closeDialog => {
                    closeDialog();
                    formik.resetForm();
                }}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                renderTrigger={renderTrigger}
                maxWidth="xs"
                dialogProps={{
                    classNames: classes.dialog,
                }}
            >
                <div className={classes.root} id="entity-dialog">
                    <InputComponent
                        keyValue="name"
                        onChange={setFieldValue}
                        value={values?.name}
                        errors={getErrors('name')}
                        type="text"
                        label={MESSAGES.name}
                        required
                    />
                    <InputComponent
                        keyValue="entity_type"
                        clearable={false}
                        required
                        onChange={setFieldValue}
                        value={values?.entity_type}
                        errors={getErrors('entity_type')}
                        type="select"
                        options={
                            entityTypes?.map(t => ({
                                label: t.name,
                                value: t.id,
                            })) ?? []
                        }
                        label={MESSAGES.type}
                        loading={fetchingEntitytypes}
                    />
                </div>
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};

Dialog.defaultProps = {
    initialData: null,
};

Dialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    saveEntity: PropTypes.func.isRequired,
};

export default Dialog;
