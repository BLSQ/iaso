import { IconButton, useRedirectTo } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import MESSAGES from '../../../constants/messages';
import { DASHBOARD_BASE_URL } from '../../../constants/urls';
import { PolioCreateEditDialog } from './CreateEditDialog';

type Props = { params?: any; campaignId?: string };

export const EditCampaignModal: FunctionComponent<Props> = ({
    params,
    campaignId,
}) => {
    const redirectTo = useRedirectTo();
    const [isOpen, setIsOpen] = useState<boolean>(
        Boolean(params.campaignId) && params.campaignId === campaignId,
    );

    const openDialog = useCallback(() => {
        redirectTo(DASHBOARD_BASE_URL, { ...params, campaignId });
        setIsOpen(true);
    }, [campaignId, params, redirectTo]);

    const closeDialog = useCallback(() => {
        const newParams = {
            ...params,
        };
        delete newParams.campaignId;
        redirectTo(DASHBOARD_BASE_URL, newParams);
        setIsOpen(false);
    }, [params, redirectTo]);

    return (
        <>
            <IconButton
                icon="edit"
                tooltipMessage={MESSAGES.edit}
                onClick={openDialog}
            />

            <PolioCreateEditDialog
                isOpen={isOpen}
                onClose={closeDialog}
                campaignId={campaignId}
            />
        </>
    );
};
