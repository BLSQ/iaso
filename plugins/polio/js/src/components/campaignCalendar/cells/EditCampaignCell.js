import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { PolioCreateEditDialog as CreateEditDialog } from '../../CreateEditDialog';
import MESSAGES from '../../../constants/messages';
import { useSelector } from 'react-redux';

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
