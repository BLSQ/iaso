import React, { ReactNode, FunctionComponent } from 'react';
import { useFormik, FormikProvider, FormikProps } from 'formik';
import * as yup from 'yup';
import {
    useSafeIntl,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import { makeStyles, Box } from '@material-ui/core';
import isEqual from 'lodash/isEqual';

import InputComponent from '../../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';

import { EntityType } from '../types/entityType';

import { baseUrls } from '../../../../constants/urls';

import MESSAGES from '../messages';

type Message = {
    id: string;
    defaultMessage: string;
};
type RenderTriggerProps = {
    openDialog: () => void;
};

type EmptyEntityType = {
    name?: string | null;
    defining_form?: number | null;
};

type Props = {
    titleMessage: Message;
    // eslint-disable-next-line no-unused-vars
    renderTrigger: ({ openDialog }: RenderTriggerProps) => ReactNode;
    initialData: EntityType | EmptyEntityType;
    // eslint-disable-next-line no-unused-vars
    saveEntityType: (e: EntityType) => void;
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

const EntityTypesDialog: FunctionComponent<Props> = ({
    titleMessage,
    renderTrigger,
    initialData = {
        name: null,
        defining_form: null,
    },
    saveEntityType,
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
            }),
        );

    const formik: FormikProps<EntityType | EmptyEntityType> = useFormik<
        EntityType | EmptyEntityType
    >({
        initialValues: initialData,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: getSchema,
        onSubmit: saveEntityType,
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
    const getErrors = k => errors[k] ?? [];
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
                {values.defining_form && (
                    <Box className={classes.view}>
                        <IconButtonComponent
                            url={`/${baseUrls.formDetail}/formId/${values.defining_form}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewForm}
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

export default EntityTypesDialog;
