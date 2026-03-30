import React, { FunctionComponent, useCallback } from 'react';
import { Box } from '@mui/material';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { BooleanInput } from 'Iaso/components/forms/BooleanInput';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import { MultiSelect } from 'Iaso/domains/pages/components/MultiSelect';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import { useGetUserRolesDropDown } from 'Iaso/domains/userRoles/hooks/requests/useGetUserRoles';
import { EditIconButton } from '../../../../../components/Buttons/EditIconButton';

import MESSAGES from '../../../messages';
import { useGetNode } from '../../api/Get';
import { useSaveNode } from '../../api/PostPutPatch';
import { useNodeValidation } from './validation';

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
    roles_required?: number[];
    can_skip_previous_nodes?: boolean;
};

export const CreateEditNode: FunctionComponent<Props> = ({
    nodeSlug,
    workflowSlug,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: node } = useGetNode({ nodeSlug, workflowSlug });
    const { data: userRoles, isFetching: isLoadingRoles } =
        useGetUserRolesDropDown();
    const { mutateAsync: save } = useSaveNode();
    const validationSchema = useNodeValidation();
    const formik = useFormik<NodeFormValues>({
        initialValues: {
            name: node?.name,
            slug: node?.slug,
            color: node?.color,
            description: node?.description,
            can_skip_previous_nodes: node?.can_skip_previous_nodes,
            roles_required: node?.roles_required?.map(r => r.id),
        },
        enableReinitialize: true,
        onSubmit: values =>
            save({ workflowSlug: workflowSlug, slug: nodeSlug, body: values }),
        validationSchema,
    });
    const handleChangeUserRoles = useCallback(
        (_, newValue: string) => {
            const value =
                newValue && newValue.length > 0 ? newValue : undefined;
            formik.setFieldTouched('roles_required', true);
            formik.setFieldValue('roles_required', value);
        },
        [formik],
    );
    const titleMessage = node?.slug ? MESSAGES.edit : MESSAGES.create;
    const title = formatMessage(titleMessage);
    const allowConfirm = formik.isValid && formik.dirty;

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
                            required
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
                    name="can_skip_previous_nodes"
                    component={BooleanInput}
                    required
                />
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.rolesRequired)}
                        name="roles_required"
                        component={MultiSelect}
                        onChange={handleChangeUserRoles}
                        isLoading={isLoadingRoles}
                        options={userRoles ?? []}
                        required
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditNode, AddButton);
const modalWithIcon = makeFullModal(CreateEditNode, EditIconButton);

export { modalWithButton as AddNode, modalWithIcon as EditNode };
