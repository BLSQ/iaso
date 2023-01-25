/* eslint-disable react/require-default-props */
/* eslint-disable camelcase */
import React, { ReactNode, FunctionComponent } from 'react';
import { useFormik, FormikProvider, FormikProps } from 'formik';
import * as yup from 'yup';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { makeStyles, Box } from '@material-ui/core';
import isEqual from 'lodash/isEqual';

import InputComponent from '../../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';

import { Entity } from '../../types/entity';

import { baseUrls } from '../../../../constants/urls';

import MESSAGES from '../messages';

import { IntlMessage } from '../../../../types/intl';

type RenderTriggerProps = {
    openDialog: () => void;
};

type EmptyEntity = {
    name?: string | null;
    attributes?: number | null;
};

type Props = {
    titleMessage: IntlMessage;
    // eslint-disable-next-line no-unused-vars
    renderTrigger: ({ openDialog }: RenderTriggerProps) => ReactNode;
    initialData?: Entity | EmptyEntity;
    // eslint-disable-next-line no-unused-vars
    saveEntity: (e: Entity) => void;
};

const useStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
    },
    view: {
        position: 'absolute',
        top: theme.spacing(1),
        right: theme.spacing(1),
    },
}));

export const Dialog: FunctionComponent<Props> = ({
    titleMessage,
    renderTrigger,
    initialData,
    saveEntity,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const getSchema = () =>
        yup.lazy(() =>
            yup.object().shape({
                name: yup
                    .string()
                    .trim()
                    .required(formatMessage(MESSAGES.nameRequired)),
                entity_type: yup.string().trim().required(),
                attributes: yup.string().trim().required(),
            }),
        );

    const formik: FormikProps<Entity | EmptyEntity> = useFormik<
        Entity | EmptyEntity
    >({
        initialValues: initialData || {
            name: null,
            attributes: null,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: getSchema,
        onSubmit: saveEntity,
    });
    const {
        values,
        setFieldValue,
        errors,
        isValid,
        initialValues,
        handleSubmit,
        resetForm,
    } = formik;
    const getErrors = k => (errors[k] ? [errors[k]] : []);

    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={handleSubmit}
                onCancel={closeDialog => {
                    closeDialog();
                    resetForm();
                }}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                renderTrigger={renderTrigger}
                maxWidth="xs"
                dialogProps={{
                    classNames: classes.dialog,
                }}
            >
                {values.attributes && (
                    <Box className={classes.view}>
                        <IconButtonComponent
                            url={`/${baseUrls.instanceDetail}/instanceId/${values.attributes}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewInstance}
                        />
                    </Box>
                )}
                <div className={classes.root} id="entity-dialog">
                    <InputComponent
                        keyValue="name"
                        onChange={setFieldValue}
                        value={values.name}
                        errors={getErrors('name')}
                        type="text"
                        label={MESSAGES.name}
                        required
                    />
                </div>
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
