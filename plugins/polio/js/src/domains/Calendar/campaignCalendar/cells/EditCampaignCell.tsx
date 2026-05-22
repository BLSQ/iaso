import React, { FunctionComponent, useCallback } from 'react';
import EditIcon from '@mui/icons-material/Settings';
import { Box, Tooltip, IconButton } from '@mui/material';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import { baseUrls } from '../../../../constants/urls';

type Props = {
    campaign: {
        original: {
            id: string;
        };
    };
};
const styles: SxStyles = {
    root: {
        '& svg': {
            fontSize: 18,
        },
    },
};

const EditCampaignCell: FunctionComponent<Props> = ({ campaign }) => {
    const redirectTo = useRedirectTo();
    const onClick = useCallback(() => {
        redirectTo(
            `${baseUrls.campaignDetails}/campaignId/${campaign.original.id}/`,
        );
    }, [campaign.original.id, redirectTo]);

    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={styles.root}>
            <Tooltip
                arrow
                title={formatMessage(MESSAGES.edit)}
                placement="top"
                TransitionProps={{ style: { marginBottom: '0' } }}
            >
                <Box>
                    <IconButton onClick={onClick} size="small">
                        <EditIcon />
                    </IconButton>
                </Box>
            </Tooltip>
        </Box>
    );
};

export { EditCampaignCell };
