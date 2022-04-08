import React, {
    FunctionComponent,
    useCallback,
    useState,
    useMemo,
} from 'react';
import { Box, Divider, Grid } from '@material-ui/core';
import ConfirmCancelDialogComponent from 'Iaso/components/dialogs/ConfirmCancelDialogComponent';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useGetCampaigns } from '../../hooks/useGetCampaigns';
import { sortCampaignNames } from '../../utils';
import {
    GroupedCampaignQuery,
    useSaveGroupedCampaign,
} from '../../hooks/useSaveGroupedCampaign';

type Props = {
    // titleMessage: IntlMessage;
    name: string;
    campaigns: string[];
    type: 'create' | 'edit';
    // eslint-disable-next-line react/require-default-props
    id?: string;
};
const renderTrigger = ({ openDialog }) => {
    return (
        <IconButtonComponent
            onClick={openDialog}
            icon="edit"
            tooltipMessage={MESSAGES.edit}
        />
    );
};

const GROUPED_CAMPAIGN_NAME = 'groupedCampaignName';
const CHILDREN_CAMPAIGNS = 'childrenCampaigns';
const makeCampaignsDropDown = campaigns =>
    campaigns
        ?.map(campaign => {
            return {
                label: campaign.obr_name,
                value: campaign.id,
            };
        })
        .sort(sortCampaignNames);

export const GroupedCampaignDialog: FunctionComponent<Props> = ({
    // titleMessage,
    name = '',
    campaigns = [],
    type,
    id,
}) => {
    const { formatMessage } = useSafeIntl();
    const [groupedCampaignName, setGroupedCampaignName] =
        useState<string>(name);
    const [campaignsToLink, setCampaignsToLink] = useState<string[]>(campaigns);
    const { data: allCampaigns } = useGetCampaigns().query;
    const allCampaignsDropdown = useMemo(
        () => makeCampaignsDropDown(allCampaigns),
        [allCampaigns],
    );
    const { mutateAsync: saveGroupedCampaign } = useSaveGroupedCampaign(type);
    const onConfirm = useCallback(
        async closeDialog => {
            const query: GroupedCampaignQuery = id
                ? {
                      id,
                      name: groupedCampaignName,
                      campaigns: campaignsToLink,
                  }
                : { name: groupedCampaignName, campaigns: campaignsToLink };
            console.log('confirm', query);
            await saveGroupedCampaign(query);
            closeDialog();
        },
        [campaignsToLink, groupedCampaignName, id, saveGroupedCampaign],
    );
    const onCancel = useCallback(closeDialog => {
        console.log('cancel');
        closeDialog();
    }, []);
    const allowConfirm = Boolean(groupedCampaignName);
    return (
        <ConfirmCancelDialogComponent
            id="grouped-campaigns-modal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
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
                    <Grid container item xs={6}>
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
                                    setCampaignsToLink(value);
                                }}
                                value={campaignsToLink}
                                required
                                multi
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
