import React, { useState, FunctionComponent } from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { PolioCreateEditDialog as CreateEditDialog } from '../../../Campaigns/MainDialog/CreateEditDialog';
import MESSAGES from '../../../../constants/messages';

type Props = {
    campaign: {
        original: {
            id: string;
        };
    };
};

const EditCampaignCell: FunctionComponent<Props> = ({ campaign }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <>
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
        </>
    );
};

export { EditCampaignCell };
