import React, { FunctionComponent } from 'react';
import { Box, Divider } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';

import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import TextInput from '../../../../../../../../hat/assets/js/apps/Iaso/domains/pages/components/TextInput';
import { EditIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { useGetProfilesDropdown } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/teams/hooks/requests/useGetProfilesDropdown';

import MESSAGES from '../messages';
import { ChronogramTask } from '../../Chronogram/types';
import { NumberInput } from '../../../../components/Inputs/NumberInput';
import { SingleSelect } from '../../../../components/Inputs/SingleSelect';

import { Chronogram } from '../../Chronogram/types';
import { ChronogramTaskMetaData } from '../../types';
import { useChronogramTaskSchema } from '../hooks/validation';
import { useCreateEditChronogramTask } from '../api/useCreateEditChronogramTask';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    chronogramTaskMetaData: ChronogramTaskMetaData;
    chronogramTask?: ChronogramTask;
    chronogram?: Chronogram;
};

const CreateEditChronogramTaskModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    chronogramTaskMetaData,
    chronogramTask,
    chronogram,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: profilesDropdown, isFetching: isFetchingProfiles } =
        useGetProfilesDropdown();

    const { mutate: confirm } = useCreateEditChronogramTask();
    const schema = useChronogramTaskSchema();
    const formik = useFormik({
        initialValues: {
            id: chronogramTask?.id,
            chronogram: chronogramTask?.chronogram || chronogram?.id,
            period: chronogramTask?.period,
            description: chronogramTask?.description,
            start_offset_in_days: chronogramTask?.start_offset_in_days,
            status: chronogramTask?.status,
            user_in_charge: chronogramTask?.user_in_charge.id,
            comment: chronogramTask?.comment,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: async values => {
            confirm(values);
        },
    });
    const isFormChanged = !isEqual(formik.values, formik.initialValues);
    const allowConfirm =
        !formik.isSubmitting && formik.isValid && isFormChanged;

    const title = chronogramTask?.id
        ? `${formatMessage(MESSAGES.modalEditTitle)}`
        : `${formatMessage(MESSAGES.modalAddTitle)}`;

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                open={isOpen}
                closeDialog={closeDialog}
                onClose={() => null}
                id="write-notification"
                dataTestId="write-notification"
                titleMessage={title}
                onConfirm={() => formik.handleSubmit()}
                onCancel={() => null}
                confirmMessage={MESSAGES.modalWriteConfirm}
                allowConfirm={allowConfirm}
                cancelMessage={MESSAGES.modalWriteCancel}
            >
                <Box mb={2}>
                    <Divider />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelPeriod)}
                        name="period"
                        component={SingleSelect}
                        options={chronogramTaskMetaData.period}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelDescription)}
                        name="description"
                        component={TextInput}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelStartOffsetInDays)}
                        name="start_offset_in_days"
                        component={NumberInput}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelStatus)}
                        name="status"
                        component={SingleSelect}
                        options={chronogramTaskMetaData.status}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelUserInCharge)}
                        name="user_in_charge"
                        component={SingleSelect}
                        options={profilesDropdown}
                        isLoading={isFetchingProfiles}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelComment)}
                        name="comment"
                        component={TextInput}
                        required
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithIcon = makeFullModal(
    CreateEditChronogramTaskModal,
    EditIconButton,
);

const modalWithButton = makeFullModal(CreateEditChronogramTaskModal, AddButton);

export { modalWithIcon as EditChronogramTaskModal };
export { modalWithButton as CreateChronogramTaskModal };
