import React, { FunctionComponent, useCallback } from 'react';
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
    rolesRequired?: number[];
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
            canSkipPreviousNodes: node?.canSkipPreviousNodes,
            rolesRequired: node?.rolesRequired.map(r => r.id),
        },
        enableReinitialize: true,
        onSubmit: values => save({ workflowSlug, ...values }),
        validationSchema,
    });
    const handleChangeUserRoles = useCallback(
        (_, newValue: string) => {
            const value =
                newValue && newValue.length > 0 ? newValue : undefined;
            formik.setFieldTouched('rolesRequired', true);
            formik.setFieldValue('rolesRequired', value);
        },
        [formik],
    );
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
