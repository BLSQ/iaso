import { AddButton, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useState } from 'react';
import MESSAGES from '../../../constants/messages';
import { PolioCreateEditDialog } from './CreateEditDialog';

export const CreateCampaignModal: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // No need to redirect on close: since we're creating a campaign, there's no campaignId in the params
    const closeDialog = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* @ts-ignore */}
            <AddButton
                onClick={() => {
                    setIsOpen(true);
                }}
            >
                {formatMessage(MESSAGES.create)}
            </AddButton>
            {isOpen && (
                <PolioCreateEditDialog isOpen={isOpen} onClose={closeDialog} />
            )}
        </>
    );
};
