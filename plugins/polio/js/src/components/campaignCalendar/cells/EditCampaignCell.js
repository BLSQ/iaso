import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { PolioCreateEditDialog as CreateEditDialog } from '../../CreateEditDialog';
import MESSAGES from '../../../constants/messages';

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
                selectedCampaign={campaign.original}
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
