import { Box, Grid } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { CampaignAsyncSelect } from '../../../CampaignsAsyncSelect/CampaignsAsyncSelect';
import { LinkTo } from 'Iaso/components/nav/LinkTo';
import { IntlMessage } from 'bluesquare-components';
import { IntegratedCampaign } from 'plugins/polio/js/src/constants/types';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
            <Grid item xs={11}>
                <CampaignAsyncSelect
                    keyValue="integrated_to"
                    handleChange={onChange}
                    initialValue={value?.obr_name}
                    label={label}
                />
            </Grid>
            <Grid item xs={1}>
                <Box pt={0.5}>
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
