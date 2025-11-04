import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import { EditIconButton } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { NumberInput, TextInput } from '../../../../../components/Inputs';
import { SingleSelect } from '../../../../../components/Inputs/SingleSelect';
import { VaccineForStock } from '../../../../../constants/types';
import { useGetVrfListByRound } from '../../../SupplyChain/hooks/api/vrf';
import { useCampaignOptions, useSaveEarmarked } from '../../hooks/api';
import MESSAGES from '../../messages';
import {
    useAvailablePresentations,
    useEarmarkOptions,
} from './dropdownOptions';
import { useEarmarkValidation } from './validation';
import { DosesPerVialDropdown } from '../../types';

type Props = {
    earmark?: any;
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    countryName: string;
    vaccine: VaccineForStock;
    vaccineStockId: string;
    dosesOptions?: DosesPerVialDropdown;
    defaultDosesPerVial: number | undefined;
};

export const CreateEditEarmarked: FunctionComponent<Props> = ({
    earmark,
    isOpen,
    closeDialog,
    countryName,
    vaccine,
    vaccineStockId,
    dosesOptions,
    defaultDosesPerVial,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveEarmarked();

    const hasFixedDosesPerVial = Boolean(defaultDosesPerVial);
    const validationSchema = useEarmarkValidation();
    const formik = useFormik<any>({
        initialValues: {
            id: earmark?.id,
            earmarked_stock_type: earmark?.earmarked_stock_type,
            campaign: earmark?.campaign,
            round_number: earmark?.round_number,
            comment: earmark?.comment,
            temporary_campaign_name: earmark?.temporary_campaign_name,
            vials_earmarked: earmark?.vials_earmarked || 0,
            doses_earmarked: earmark?.doses_earmarked || 0,
            doses_per_vial: earmark?.doses_per_vial || defaultDosesPerVial,
            vaccine_stock: vaccineStockId,
        },
        onSubmit: values => save(values),
        validationSchema,
    });

    const { setFieldValue, setFieldTouched } = formik;

    const { campaignOptions, isFetching, roundNumberOptions } =
        useCampaignOptions(
            countryName,
            formik.values.campaign,
            formik.values.round_number,
        );

    const selectedRound = roundNumberOptions.find(
        round => round.value === formik.values.round_number,
    );
    const earmarkTypeOptions = useEarmarkOptions();
    const availableDosesPresentations = useAvailablePresentations(
        dosesOptions,
        earmark,
    );

    const handleVialsChange = useCallback(
        value => {
            setFieldValue('vials_earmarked', value);
            setFieldTouched('vials_earmarked', true);
        },
        [setFieldTouched, setFieldValue, vaccine],
    );

    const titleMessage = earmark?.id ? MESSAGES.edit : MESSAGES.create;
    const title = `${countryName} - ${vaccine}: ${formatMessage(
        titleMessage,
    )} ${formatMessage(MESSAGES.earmarked)}`;
    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});
    const { data: vrfList } = useGetVrfListByRound(selectedRound?.original?.id);
    const quantityOrdered = vrfList?.reduce(
        (acc, vrf) => acc + (vrf.quantities_ordered_in_doses || 0),
        0,
    );
    const isNewEarmark = !earmark?.id;
    const hasQuantityOrdered = quantityOrdered && quantityOrdered > 0;
    // https://bluesquare.atlassian.net/browse/POLIO-1924
    useEffect(() => {
        if (hasQuantityOrdered && isNewEarmark) {
            handleVialsChange(quantityOrdered);
        }
    }, [hasQuantityOrdered, isNewEarmark, handleVialsChange, quantityOrdered]);
    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={title}
                onConfirm={() => formik.handleSubmit()}
                allowConfirm={allowConfirm}
                open={isOpen}
                closeDialog={closeDialog}
                id="earmarked-modal"
                dataTestId="earmarked-modal"
                onCancel={() => null}
                onClose={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
            >
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.movement)}
                        name="earmarked_stock_type"
                        component={SingleSelect}
                        required
                        options={earmarkTypeOptions}
                        withMarginTop
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.campaign)}
                        name="campaign"
                        component={SingleSelect}
                        options={campaignOptions}
                        withMarginTop
                        isLoading={isFetching}
                        disabled={!countryName}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.round)}
                        name="round_number"
                        component={SingleSelect}
                        options={roundNumberOptions}
                        withMarginTop
                        isLoading={isFetching}
                        disabled={!formik.values.campaign}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.earmarked_vials)}
                        name="vials_earmarked"
                        component={NumberInput}
                        onChange={handleVialsChange}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.doses_per_vial)}
                        name="doses_per_vial"
                        component={SingleSelect}
                        options={availableDosesPresentations}
                        disabled={hasFixedDosesPerVial}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.comment)}
                        name="comment"
                        multiline
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.temporary_campaign_name)}
                        name="temporary_campaign_name"
                        component={TextInput}
                        shrinkLabel={false}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(CreateEditEarmarked, AddButton);
const modalWithIcon = makeFullModal(CreateEditEarmarked, EditIconButton);

export { modalWithButton as CreateEarmarked, modalWithIcon as EditEarmarked };
