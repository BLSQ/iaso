import React, { FunctionComponent, useState } from 'react';
import EditIcon from '@mui/icons-material/Settings';
import { Box, Tooltip, IconButton } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';

import MESSAGES from '../../../../constants/messages';
import { PolioCreateEditDialog as CreateEditDialog } from '../../../Campaigns/MainDialog/CreateEditDialog';

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
    const [dialogOpen, setDialogOpen] = useState(false);

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
                    <IconButton
                        onClick={() => setDialogOpen(true)}
                        size="small"
                    >
                        <EditIcon />
                    </IconButton>
                </Box>
            </Tooltip>
            <CreateEditDialog
                campaignId={campaign.original.id}
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </Box>
    );
};

export { EditCampaignCell };
