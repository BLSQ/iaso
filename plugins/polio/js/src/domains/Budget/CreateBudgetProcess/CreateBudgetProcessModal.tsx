import React, { FunctionComponent, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Field, FormikProvider, useFormik } from 'formik';
import {
    AddButton,
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';
import { SingleSelect } from '../../../components/Inputs/SingleSelect';
import { useGetNewBudgetProcessDropdowns } from '../hooks/api/useGetNewBudgetProcessDropdowns';
import {
    Options,
    OptionsCountry,
    OptionsCampaigns,
    OptionsRounds,
} from '../types';

const mapOptions = (
    item: OptionsCountry | OptionsCampaigns | OptionsRounds,
): Options => {
    return {
        label: `${item.name}`,
        value: item.id,
    };
};

const useDependentCampaignOptionsState = (
    campaigns: OptionsCampaigns[],
    formik,
) => {
    const [value, setValue] = useState<Options[]>([]);

    // When "Country" value changes, filter and update "Campaign" values.
    useEffect(() => {
        const filtered = campaigns.filter(
            i => String(i.country_id) === String(formik.values.country),
        );
        formik.setFieldValue('campaign', '');
        setValue(filtered.map(mapOptions));
    }, [formik.values.country]);

    return [value, setValue];
};

const useDependentRoundOptionsState = (rounds: OptionsRounds[], formik) => {
    const [value, setValue] = useState<Options[]>([]);

    // When "Campaign" value changes, filter and update "Rounds" values.
    useEffect(() => {
        const filtered = rounds.filter(
            i => String(i.campaign_id) === String(formik.values.campaign),
        );
        formik.setFieldValue('round', '');
        setValue(filtered.map(mapOptions));
    }, [formik.values.campaign]);

    return [value, setValue];
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const CreateBudgetProcessModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: dropdownsData, isFetching: isFetchingDropdownData } =
        useGetNewBudgetProcessDropdowns();

    const formik = useFormik({
        initialValues: {
            country: '',
            campaign: '',
            round: '',
        },
        onSubmit: async values => {
            // confirm(values);
            console.log(JSON.stringify(values, null, 2));
        },
    });

    const [currentCampaignOptions] = useDependentCampaignOptionsState(
        dropdownsData?.campaigns || [],
        formik,
    );

    const [currentRoundOptions] = useDependentRoundOptionsState(
        dropdownsData?.rounds || [],
        formik,
    );

    const titleMessage = formatMessage(MESSAGES.createBudgetProcessTitle);

    return (
        <>
            {isFetchingDropdownData && <LoadingSpinner />}
            {!isFetchingDropdownData && (
                <FormikProvider value={formik}>
                    <ConfirmCancelModal
                        open={isOpen}
                        closeDialog={closeDialog}
                        onClose={() => null}
                        id="create-budget-process"
                        dataTestId="create-budget-process"
                        titleMessage={titleMessage}
                        onConfirm={() => formik.handleSubmit()}
                        onCancel={() => null}
                        confirmMessage={MESSAGES.save}
                        cancelMessage={MESSAGES.cancel}
                    >
                        <Box mb={2} mt={2}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.createBudgetProcessTitle,
                                )}
                                name="country"
                                component={SingleSelect}
                                options={
                                    dropdownsData?.countries.map(mapOptions) ||
                                    []
                                }
                            />
                        </Box>
                        <Box mb={2}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.createBudgetProcessTitle,
                                )}
                                name="campaign"
                                component={SingleSelect}
                                options={currentCampaignOptions}
                            />
                        </Box>
                        <Box mb={2}>
                            <Field
                                label={formatMessage(
                                    MESSAGES.createBudgetProcessTitle,
                                )}
                                name="round"
                                component={SingleSelect}
                                options={currentRoundOptions}
                            />
                        </Box>
                    </ConfirmCancelModal>
                </FormikProvider>
            )}
        </>
    );
};

const modal = makeFullModal(CreateBudgetProcessModal, AddButton);

export { modal as CreateBudgetProcessModal };
