import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Box } from '@mui/material';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import { BooleanInput } from 'Iaso/components/forms/BooleanInput';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { MultiSelect } from 'Iaso/domains/pages/components/MultiSelect';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';

import MESSAGES from '../../messages';
import { useGetNode } from '../api/Get';

type Props = {
    workflowSlug: string;
    nodeSlug?: any;
    isOpen: boolean;
    closeDialog: () => void;
};

export type NodeFormValues = {
    slug?: string;
    name?: string;
    description?: string;
    color?: string;
    rolesRequired?: { name: string; id: number }[];
    canSkipPreviousNodes?: boolean;
};

export const CreateEditNode: FunctionComponent<Props> = ({
    nodeSlug,
    workflowSlug,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: node } = useGetNode({ nodeSlug, workflowSlug });
    // const { mutateAsync: save } = useSaveNode();
    // const validationSchema = useNodeValidation();
    const save = values => {};
    const formik = useFormik<NodeFormValues>({
        initialValues: {
            name: node?.name,
            slug: node?.slug,
            color: node?.color,
            description: node?.description,
            canSkipPreviousNodes: node?.canSkipPreviousNodes,
            rolesRequired: node?.rolesRequired,
        },
        enableReinitialize: true,
        onSubmit: values => save(values),
        // validationSchema,
    });

    const titleMessage = node?.slug ? MESSAGES.edit : MESSAGES.create;
    const title = formatMessage(titleMessage);
    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={title}
                onConfirm={() => formik.handleSubmit()}
                allowConfirm={allowConfirm}
                open={isOpen}
                closeDialog={closeDialog}
                id="node-modal"
                dataTestId="node-modal"
                onCancel={() => null}
                onClose={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
            >
                <>
                    <Box mb={2} mt={2}>
                        <Field
                            label={formatMessage(MESSAGES.name)}
                            name="name"
                            component={TextInput}
                            withMarginTop
                        />
                    </Box>
                    <Box mb={2}>
                        <ColorPicker
                            currentColor={formik.values.color}
                            onChangeColor={value => {
                                formik.setFieldTouched('color', true);
                                formik.setFieldValue('color', value);
                            }}
                        />
                    </Box>
                </>

                <Field
                    label={formatMessage(MESSAGES.description)}
                    name="description"
                    component={TextInput}
                />
                <Field
                    label={formatMessage(MESSAGES.canSkipPreviousNodes)}
                    name="canSkipPreviousNodes"
                    component={BooleanInput}
                    required
                />
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.rolesRequired)}
                        name="rolesRequired"
                        component={MultiSelect}
                        options={[]}
                        required
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditNode, AddButton);
const modalWithIcon = makeFullModal(CreateEditNode, EditIconButton);

export { modalWithButton as CreateNode, modalWithIcon as EditNode };
