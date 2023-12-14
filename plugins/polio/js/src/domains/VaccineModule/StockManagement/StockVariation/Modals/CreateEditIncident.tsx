import React, { FunctionComponent } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { Box } from '@material-ui/core';
import { Vaccine } from '../../../../../constants/types';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import MESSAGES from '../../messages';
import {
    TextInput,
    DateInput,
    NumberInput,
} from '../../../../../components/Inputs';
import { useSaveIncident } from '../../hooks/api';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { useIncidentOptions } from './useIncidentOptions';

type Props = {
    incident?: any;
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    countryName: string;
    vaccine: Vaccine;
};

export const CreateEditIncident: FunctionComponent<Props> = ({
    incident,
    isOpen,
    closeDialog,
    countryName,
    vaccine,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveIncident();
    const formik = useFormik<any>({
        initialValues: {
            id: incident?.id,
            stock_correction: incident?.stock_correction,
            incident_reception_rrt: incident?.incident_reception_rrt,
            date_of_report: incident?.date_of_report,
            usable_vials: incident?.usable_vials,
            unusable_vials: incident?.unusable_vials,
        },
        onSubmit: values => save(values),
        // TODO add validation
        // validationSchema,
    });
    const incidentTypeOptions = useIncidentOptions();
    const titleMessage = incident?.id ? MESSAGES.edit : MESSAGES.create;
    const title = `${countryName} - ${vaccine}: ${formatMessage(
        titleMessage,
    )} ${formatMessage(MESSAGES.formA)}`;
    // TODO add conditions
    const allowConfirm = true;

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={title}
                onConfirm={() => formik.handleSubmit()}
                allowConfirm={allowConfirm}
                open={isOpen}
                closeDialog={closeDialog}
                id="formA-modal"
                dataTestId="formA-modal"
                onCancel={() => null}
                onClose={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
            >
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.stockCorrection)}
                        name="stock_correction"
                        component={SingleSelect}
                        required
                        options={incidentTypeOptions}
                        withMarginTop
                    />
                </Box>
                <Field
                    label={formatMessage(MESSAGES.incident_reception_rrt)}
                    name="incident_reception_rrt"
                    component={DateInput}
                />
                <Field
                    label={formatMessage(MESSAGES.date_of_report)}
                    name="date_of_report"
                    component={DateInput}
                />
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.usable_vials)}
                        name="usable_vials"
                        component={NumberInput}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.unusable_vials)}
                        name="unusable_vials"
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditIncident, AddButton);
const modalWithIcon = makeFullModal(CreateEditIncident, EditIconButton);

export { modalWithButton as CreateIncident, modalWithIcon as EditIncident };
