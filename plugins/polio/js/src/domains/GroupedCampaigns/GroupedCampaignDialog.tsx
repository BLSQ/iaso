/* eslint-disable react/require-default-props */
import { Box, Divider, Grid } from '@mui/material';
import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useMemo,
    useState,
} from 'react';
// @ts-ignore
import ConfirmCancelDialogComponent from 'Iaso/components/dialogs/ConfirmCancelDialogComponent';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { commaSeparatedIdsToStringArray } from '../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import MESSAGES from '../../constants/messages';
import { makeCampaignsDropDownWithUUID } from '../../utils';
import { useGetCampaigns } from '../Campaigns/hooks/api/useGetCampaigns';
import {
    GroupedCampaignQuery,
    useSaveGroupedCampaign,
} from './hooks/useSaveGroupedCampaign';

type Props = {
    name?: string;
    campaigns?: string[];
    type: 'create' | 'edit';
    id?: string;
    renderTrigger: (openDialog: { openDialog: () => void }) => ReactNode;
};

const GROUPED_CAMPAIGN_NAME = 'groupedCampaignName';
const CHILDREN_CAMPAIGNS = 'childrenCampaigns';

const emptyCampaigns = [];

export const GroupedCampaignDialog: FunctionComponent<Props> = ({
    name = '',
    campaigns = emptyCampaigns,
    type,
    id,
    renderTrigger,
}) => {
    const { formatMessage } = useSafeIntl();
    const [groupedCampaignName, setGroupedCampaignName] =
        useState<string>(name);
    const [campaignsToLink, setCampaignsToLink] = useState<string[]>(campaigns);
    // TODO refactor this hook to make more flexible
    const { data: allCampaigns, isFetching: isFetchingCamaigns } =
        useGetCampaigns();
    const allCampaignsDropdown = useMemo(
        () => makeCampaignsDropDownWithUUID(allCampaigns),
        [allCampaigns],
    );
    const { mutateAsync: saveGroupedCampaign } = useSaveGroupedCampaign(type);

    const reset = useCallback(() => {
        setGroupedCampaignName(name);
        setCampaignsToLink(campaigns);
    }, [campaigns, name]);

    const onConfirm = useCallback(
        async closeDialog => {
            const query: GroupedCampaignQuery = id
                ? {
                      id,
                      name: groupedCampaignName,
                      campaigns_ids: campaignsToLink,
                  }
                : {
                      name: groupedCampaignName,
                      campaigns_ids: campaignsToLink,
                  };
            // call in this order to avoid mem leak error
            closeDialog();
            reset();
            await saveGroupedCampaign(query);
        },
        [campaignsToLink, groupedCampaignName, id, saveGroupedCampaign, reset],
    );
    const onCancel = useCallback(
        closeDialog => {
            reset();
            closeDialog();
        },
        [reset],
    );
    const allowConfirm =
        Boolean(groupedCampaignName) && campaignsToLink.length > 0;

    return (
        <ConfirmCancelDialogComponent
            id="grouped-campaigns-modal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.close}
            maxWidth="xs"
            titleMessage={MESSAGES.editGroupedCampaign}
            onCancel={onCancel}
            dataTestId="grouped-campaigns-modal"
            allowConfirm={allowConfirm}
            additionalButton={undefined}
            additionalMessage={undefined}
            allowConfimAdditionalButton={undefined}
            onAdditionalButtonClick={undefined}
        >
            <>
                <Box mb={2}>
                    <Divider />
                </Box>
                <Grid
                    container
                    spacing={2}
                    direction="row"
                    justifyContent="space-around"
                >
                    <Grid container item xs={12}>
                        <Grid item xs={12}>
                            <InputComponent
                                keyValue={GROUPED_CAMPAIGN_NAME}
                                type="text"
                                labelString={formatMessage(MESSAGES.name)}
                                onChange={(_keyValue, value) => {
                                    setGroupedCampaignName(value);
                                }}
                                value={groupedCampaignName}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <InputComponent
                                keyValue={CHILDREN_CAMPAIGNS}
                                type="select"
                                options={allCampaignsDropdown}
                                labelString={formatMessage(
                                    MESSAGES.campaignsToLink,
                                )}
                                onChange={(_keyValue, value) => {
                                    setCampaignsToLink(
                                        commaSeparatedIdsToStringArray(value),
                                    );
                                }}
                                value={campaignsToLink}
                                required
                                multi
                                loading={isFetchingCamaigns}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
