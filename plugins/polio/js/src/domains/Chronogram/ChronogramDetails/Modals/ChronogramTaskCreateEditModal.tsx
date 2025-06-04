import React, { FunctionComponent } from 'react';
import { Box, Divider } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';

import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
    InputWithInfos,
} from 'bluesquare-components';

import * as Permission from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import TextInput from '../../../../../../../../hat/assets/js/apps/Iaso/domains/pages/components/TextInput';
import { EditIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import MESSAGES from '../messages';
import { ChronogramTask, Chronogram } from '../../Chronogram/types';
import { NumberInput } from '../../../../components/Inputs/NumberInput';
import { SingleSelect } from '../../../../components/Inputs/SingleSelect';

import { ChronogramTaskMetaData } from '../../types';
import { useChronogramTaskSchema } from '../hooks/validation';
import { useCreateEditChronogramTask } from '../api/useCreateEditChronogramTask';
import { useCurrentUser } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { userHasPermission } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';

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

    const { mutate: confirm } = useCreateEditChronogramTask();
    const schema = useChronogramTaskSchema();
    const formik = useFormik({
        initialValues: {
            id: chronogramTask?.id,
            chronogram: chronogramTask?.chronogram || chronogram?.id,
            period: chronogramTask?.period,
            description_en: chronogramTask?.description_en,
            description_fr: chronogramTask?.description_fr,
            start_offset_in_days: chronogramTask?.start_offset_in_days,
            status: chronogramTask?.status,
            user_in_charge: chronogramTask?.user_in_charge,
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

    const currentUser = useCurrentUser();
    const userHasReadAndWritePerm = userHasPermission(
        Permission.POLIO_CHRONOGRAM,
        currentUser,
    );
    const userHasRestrictedWritePerm = userHasPermission(
        Permission.POLIO_CHRONOGRAM_RESTRICTED_WRITE,
        currentUser,
    );

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
                        disabled={!userHasReadAndWritePerm}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelDescriptionEn)}
                        name="description_en"
                        component={TextInput}
                        required
                        disabled={!userHasReadAndWritePerm}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelDescriptionFr)}
                        name="description_fr"
                        component={TextInput}
                        disabled={!userHasReadAndWritePerm}
                    />
                </Box>
                <Box mb={2}>
                    <InputWithInfos
                        infos={formatMessage(
                            MESSAGES.labelStartOffsetInDaysTooltip,
                        )}
                    >
                        <Field
                            label={formatMessage(
                                MESSAGES.labelStartOffsetInDays,
                            )}
                            name="start_offset_in_days"
                            component={NumberInput}
                            required
                            disabled={!userHasReadAndWritePerm}
                        />
                    </InputWithInfos>
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
                        component={TextInput}
                        disabled={
                            !userHasReadAndWritePerm &&
                            !userHasRestrictedWritePerm
                        }
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelComment)}
                        name="comment"
                        component={TextInput}
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
