import React, { FunctionComponent } from 'react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Grid } from '@mui/material';
import { IntlMessage } from 'bluesquare-components';
import { LinkTo } from 'Iaso/components/nav/LinkTo';
import { IntegratedCampaign } from 'plugins/polio/js/src/constants/types';
import { CampaignAsyncSelect } from '../../../CampaignsAsyncSelect/CampaignsAsyncSelect';

type Props = {
    onChange: (keyValue: string, value: unknown) => void;
    label: IntlMessage;
    value: IntegratedCampaign | undefined;
};

export const IntegratedCampaignField: FunctionComponent<Props> = ({
    onChange,
    label,
    value,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid size={11}>
                <CampaignAsyncSelect
                    keyValue="integrated_to"
                    handleChange={onChange}
                    initialValue={value?.obr_name}
                    label={label}
                />
            </Grid>
            <Grid size={1}>
                <Box sx={{
                    pt: 0.5
                }}>
                    <LinkTo
                        url={`campaignId/${value?.id}`}
                        condition
                        useIcon
                        overrideIcon={OpenInNewIcon}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};
