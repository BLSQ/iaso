import { IconButton } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import MESSAGES from '../../../constants/messages';
import { PolioCreateEditDialog } from './CreateEditDialog';
import { DASHBOARD_BASE_URL } from '../../../constants/urls';
import { useRedirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';

type Props = { params?: any; campaignId?: string };

export const EditCampaignModal: FunctionComponent<Props> = ({
    params,
    campaignId,
}) => {
    const redirectTo = useRedirectTo();
    const [isOpen, setIsOpen] = useState<boolean>(false);

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

    // Effect required when using deep linking
    useEffect(() => {
        if (params.campaignId === campaignId && !isOpen) {
            setIsOpen(true);
        }
        // only need to run once on load
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
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
