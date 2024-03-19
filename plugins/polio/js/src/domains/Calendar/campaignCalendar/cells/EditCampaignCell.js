import { IconButton as IconButtonComponent } from 'bluesquare-components';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import MESSAGES from '../../../../constants/messages';
import { PolioCreateEditDialog as CreateEditDialog } from '../../../Campaigns/MainDialog/CreateEditDialog.tsx';

const EditCampaignCell = ({ campaign }) => {
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

EditCampaignCell.propTypes = {
    campaign: PropTypes.object.isRequired,
};

export { EditCampaignCell };
