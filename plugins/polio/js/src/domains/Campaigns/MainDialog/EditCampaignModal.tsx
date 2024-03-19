import { IconButton } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../constants/messages';
import { DASHBOARD_BASE_URL } from '../../../constants/routes';
import { PolioCreateEditDialog } from './CreateEditDialog';

type Props = { router?: Router; params?: any; campaignId?: string };

export const EditCampaignModal: FunctionComponent<Props> = ({
    router,
    params,
    campaignId,
}) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const openDialog = useCallback(() => {
        dispatch(redirectTo(DASHBOARD_BASE_URL, { ...params, campaignId }));
        setIsOpen(true);
    }, [campaignId, dispatch, params]);

    const closeDialog = useCallback(() => {
        dispatch(
            // Passing the account id to avoid a redirection which would slow down the closing of the modal
            redirectTo(DASHBOARD_BASE_URL, { accountId: params.accountId }),
        );
    }, [dispatch, params.accountId]);

    // Effect required when using deep linking
    useEffect(() => {
        if (router?.params.campaignId === campaignId && !isOpen) {
            setIsOpen(true);
        }
    }, [campaignId, isOpen, router?.params.campaignId]);

    return (
        <>
            <IconButton
                icon="edit"
                tooltipMessage={MESSAGES.edit}
                onClick={openDialog}
            />

            {isOpen && (
                <PolioCreateEditDialog
                    isOpen={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        closeDialog();
                    }}
                    campaignId={campaignId}
                />
            )}
        </>
    );
};
