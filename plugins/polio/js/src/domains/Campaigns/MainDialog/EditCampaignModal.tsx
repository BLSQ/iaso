import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { IconButton } from 'bluesquare-components';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import MESSAGES from '../../../constants/messages';
import { PolioCreateEditDialog } from './CreateEditDialog';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { DASHBOARD_BASE_URL } from '../../../constants/routes';

type Props = { router?: Router; params?: any; campaignId?: string };

export const EditCampaignModal: FunctionComponent<Props> = ({
    router,
    params,
    campaignId,
}) => {
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const openDialog = useCallback(() => {
        // setIsOpen(true);
        // const url = genUrl(router, {
        //     campaignId,
        // });
        dispatch(redirectTo(DASHBOARD_BASE_URL, { ...params, campaignId }));
    }, [campaignId, dispatch, params]);

    const closeDialog = useCallback(() => {
        console.log('CLOSING');
        setIsOpen(false);
        // const url = genUrl(router, {
        //     campaignId: undefined,
        // });
        dispatch(redirectTo(DASHBOARD_BASE_URL, {}));
    }, [dispatch]);

    useEffect(() => {
        if (router?.params.campaignId === campaignId && !isOpen) {
            // openDialog();
            console.log('EFFECT');
            setIsOpen(true);
        }
        if (!router?.params.campaignId && isOpen) {
            setIsOpen(false);
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
                    onClose={() => closeDialog()}
                    campaignId={campaignId}
                />
            )}
        </>
    );
};
