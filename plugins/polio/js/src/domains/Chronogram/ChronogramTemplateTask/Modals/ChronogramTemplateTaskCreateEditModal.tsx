import React, { FunctionComponent } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
    InputWithInfos,
} from 'bluesquare-components';
import { Box, Divider } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';

import TextInput from '../../../../../../../../hat/assets/js/apps/Iaso/domains/pages/components/TextInput';
import { EditIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { NumberInput } from '../../../../components/Inputs/NumberInput';
import { SingleSelect } from '../../../../components/Inputs/SingleSelect';

import MESSAGES from '../messages';
import { ChronogramTemplateTask } from '../types';

import { ChronogramTaskMetaData } from '../../types';
import { useChronogramTemplateTaskSchema } from '../hooks/validation';
import { useCreateEditChronogramTemplateTask } from '../api/useCreateEditChronogramTemplateTask';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    chronogramTaskMetaData: ChronogramTaskMetaData;
    chronogramTemplateTask?: ChronogramTemplateTask;
};

const CreateEditChronogramTemplateTaskModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    chronogramTaskMetaData,
    chronogramTemplateTask,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: confirm } = useCreateEditChronogramTemplateTask();
    const schema = useChronogramTemplateTaskSchema();
    const formik = useFormik({
        initialValues: {
            id: chronogramTemplateTask?.id,
            period: chronogramTemplateTask?.period,
            description_en: chronogramTemplateTask?.description_en,
            description_fr: chronogramTemplateTask?.description_fr,
            start_offset_in_days: chronogramTemplateTask?.start_offset_in_days,
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

    const title = chronogramTemplateTask?.id
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
                        label={formatMessage(MESSAGES.labelDescriptionEn)}
                        name="description_en"
                        component={TextInput}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelDescriptionFr)}
                        name="description_fr"
                        component={TextInput}
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
                        />
                    </InputWithInfos>
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithIcon = makeFullModal(
    CreateEditChronogramTemplateTaskModal,
    EditIconButton,
);

const modalWithButton = makeFullModal(
    CreateEditChronogramTemplateTaskModal,
    AddButton,
);

export { modalWithIcon as EditChronogramTemplateTaskModal };
export { modalWithButton as CreateChronogramTemplateTaskModal };
