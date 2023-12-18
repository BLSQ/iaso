/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Box, Divider } from '@material-ui/core';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';

import TextInput from '../../../../../../../hat/assets/js/apps/Iaso/domains/pages/components/TextInput';
import { DateInput } from '../../../components/Inputs/DateInput';
import { EditIconButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { OrgUnitsLevels as OrgUnitSelect } from '../../../components/Inputs/OrgUnitsSelect';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';

import MESSAGES from '../messages';
import { NotificationsApiData, NotificationsMetaData } from '../types';
import { useCreateEditNotification } from '../hooks/api';
import { useNotificationSchema } from '../hooks/validation';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    notificationsMetaData: NotificationsMetaData;
    notification?: NotificationsApiData;
};

const CreateEditNotificationModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    notificationsMetaData,
    notification,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: confirm } = useCreateEditNotification();
    const schema = useNotificationSchema();
    const formik = useFormik({
        initialValues: {
            id: notification?.id,
            closest_match_vdpv2: notification?.closest_match_vdpv2,
            date_of_onset: notification?.date_of_onset,
            date_results_received: notification?.date_results_received,
            epid_number: notification?.epid_number,
            lineage: notification?.lineage,
            org_unit: notification?.org_unit,
            site_name: notification?.site_name,
            source: notification?.source,
            vdpv_category: notification?.vdpv_category,
            vdpv_nucleotide_diff_sabin2:
                notification?.vdpv_nucleotide_diff_sabin2,
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

    const title = notification?.id
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
                        label={formatMessage(MESSAGES.labelEpid)}
                        name="epid_number"
                        component={TextInput}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelVdpvCategory)}
                        name="vdpv_category"
                        component={SingleSelect}
                        required
                        options={notificationsMetaData.vdpv_category}
                        clearable={false}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelSource)}
                        name="source"
                        component={SingleSelect}
                        required
                        options={notificationsMetaData.source}
                        clearable={false}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(
                            MESSAGES.labelVdpvNucleotideDiffSabin2,
                        )}
                        name="vdpv_nucleotide_diff_sabin2"
                        component={TextInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        required
                        component={OrgUnitSelect}
                        label={formatMessage(MESSAGES.labelOrgUnit)}
                        name="org_unit"
                        allowedTypes={
                            notificationsMetaData.org_unit_allowed_ids
                        }
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelSiteName)}
                        name="site_name"
                        component={TextInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelLineage)}
                        name="lineage"
                        component={TextInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelDateOfOnset)}
                        name="date_of_onset"
                        component={DateInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelClosestMatchVdpv2)}
                        name="closest_match_vdpv2"
                        component={TextInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.labelDateResultsReceived)}
                        name="date_results_received"
                        component={DateInput}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithIcon = makeFullModal(
    CreateEditNotificationModal,
    EditIconButton,
);
const modalWithButton = makeFullModal(CreateEditNotificationModal, AddButton);

export { modalWithIcon as EditNotificationModal };
export { modalWithButton as CreateNotificationModal };
