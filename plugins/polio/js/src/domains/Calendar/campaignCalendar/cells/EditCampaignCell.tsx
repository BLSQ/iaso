import { Box } from '@mui/material';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import React, { FunctionComponent, useState } from 'react';
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

    return (
        <Box sx={styles.root}>
            <IconButtonComponent
                onClick={() => setDialogOpen(true)}
                icon="edit"
                tooltipMessage={MESSAGES.edit}
                size="small"
            />
            <CreateEditDialog
                campaignId={campaign.original.id}
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </Box>
    );
};

export { EditCampaignCell };
