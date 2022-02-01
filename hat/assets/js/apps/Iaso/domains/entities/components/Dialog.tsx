import React, { ReactNode, FunctionComponent } from 'react';
import { useFormik, FormikProvider, FormikProps } from 'formik';
import * as yup from 'yup';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { makeStyles } from '@material-ui/core';
import isEqual from 'lodash/isEqual';

import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { useGetTypes } from '../hooks/useGetTypes';

import { Entity } from '../types/entity';

import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';

type Message = {
    id: string;
    defaultMessage: string;
};
type RenderTriggerProps = {
    openDialog: () => void;
};

type EmptyEntity = {
    name?: string | null;
    attributes?: number | null;
    entity_type?: number | null;
};

type Props = {
    titleMessage: Message;
    // eslint-disable-next-line no-unused-vars
    renderTrigger: ({ openDialog }: RenderTriggerProps) => ReactNode;
    initialData: Entity | EmptyEntity;
    // eslint-disable-next-line no-unused-vars
    saveEntity: (e: Entity) => void;
};

const useStyles = makeStyles(() => ({
    root: {
        position: 'relative',
    },
}));

const Dialog: FunctionComponent<Props> = ({
    titleMessage,
    renderTrigger,
    initialData = {
        name: null,
        entity_type: null,
        attributes: null,
    },
    saveEntity,
}) => {
    const classes: any = useStyles();
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
                attributes: yup.string().trim().required(),
            }),
        );

    const formik: FormikProps<Entity | EmptyEntity> = useFormik<
        Entity | EmptyEntity
    >({
        initialValues: initialData,
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: getSchema,
        onSubmit: saveEntity,
    });
    const { values, setFieldValue, errors, isValid, initialValues } = formik;
    const getErrors = k => (errors[k] ? [errors[k]] : []);

    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
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
                    {values.attributes && (
                        <IconButtonComponent
                            url={`/${baseUrls.instanceDetail}/instanceId/${values.attributes}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewInstance}
                        />
                    )}
                    <InputComponent
                        keyValue="name"
                        onChange={setFieldValue}
                        value={values.name}
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
                        value={values.entity_type}
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

export default Dialog;
