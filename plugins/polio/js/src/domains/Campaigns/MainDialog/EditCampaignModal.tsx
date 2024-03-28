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
        const newParams = {
            ...params,
        };
        delete newParams.campaignId;
        dispatch(redirectTo(DASHBOARD_BASE_URL, newParams));
        setIsOpen(false);
    }, [dispatch, params]);

    // Effect required when using deep linking
    useEffect(() => {
        if (router?.params.campaignId === campaignId && !isOpen) {
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
