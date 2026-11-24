import React, { FunctionComponent, useCallback } from 'react';
import Box from '@mui/material/Box/Box';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { BooleanInput } from 'Iaso/components/forms/BooleanInput';
import { MultiSelect } from 'Iaso/domains/pages/components/MultiSelect';
import TextInput from 'Iaso/domains/pages/components/TextInput';
import { useGetUserRolesDropDown } from 'Iaso/domains/userRoles/hooks/requests/useGetUserRoles';

import { useSaveNode } from '../../api/PostPutPatch';
import MESSAGES from '../../messages';
import { useNodeValidation } from './validation';

type Props = {
    workflowSlug: string;
    isOpen: boolean;
    closeDialog: () => void;
    isFirstStep?: boolean;
};

export type NodeFormValues = {
    name?: string;
    description?: string;
    roles_required?: number[];
    can_skip_previous_nodes?: boolean;
};

export const CreateEditNode: FunctionComponent<Props> = ({
    workflowSlug,
    isOpen,
    closeDialog,
    isFirstStep = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: userRoles, isFetching: isLoadingRoles } =
        useGetUserRolesDropDown();

    const { mutateAsync: save } = useSaveNode(workflowSlug);
    const validationSchema = useNodeValidation();
    const formik = useFormik<NodeFormValues>({
        initialValues: {},
        onSubmit: values => save({ workflowSlug: workflowSlug, body: values }),
        validationSchema,
    });
    const handleChangeUserRoles = useCallback(
        (_: string, newValue: string) => {
            const value = newValue && newValue.length > 0 ? newValue : [];
            formik.setFieldTouched('roles_required', true);
            formik.setFieldValue('roles_required', value);
        },
        [formik],
    );
    const title = formatMessage(MESSAGES.create);
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
                <Box mb={2} mt={2}>
                    <Field
                        label={formatMessage(MESSAGES.name)}
                        name="name"
                        component={TextInput}
                        required
                        withMarginTop
                    />
                </Box>
                <Box mb={isFirstStep ? 2 : 0}>
                    <Field
                        label={formatMessage(MESSAGES.description)}
                        name="description"
                        component={TextInput}
                    />
                </Box>
                {!isFirstStep && (
                    <Field
                        label={formatMessage(MESSAGES.canSkipPreviousNodes)}
                        name="can_skip_previous_nodes"
                        component={BooleanInput}
                    />
                )}
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.rolesRequired)}
                        name="roles_required"
                        component={MultiSelect}
                        onChange={handleChangeUserRoles}
                        isLoading={isLoadingRoles}
                        options={userRoles ?? []}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditNode, AddButton);

export { modalWithButton as AddNode };
