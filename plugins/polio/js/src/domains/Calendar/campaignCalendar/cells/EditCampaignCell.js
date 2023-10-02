import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { useSelector } from 'react-redux';
import { PolioCreateEditDialog as CreateEditDialog } from '../../../Campaigns/MainDialog/CreateEditDialog'
import MESSAGES from '../../../../constants/messages';

const EditCampaignCell = ({ campaign }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const isLogged = useSelector(state => Boolean(state.users.current));

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
