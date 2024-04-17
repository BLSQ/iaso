import { AddButton, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { redirectTo } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { genUrl } from '../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../constants/messages';
import { PolioCreateEditDialog } from './CreateEditDialog';

type Props = { router?: Router };

export const CreateCampaignModal: FunctionComponent<Props> = ({ router }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const closeDialog = useCallback(() => {
        setIsOpen(false);
        const url = genUrl(router, {
            campaignId: undefined,
        });
        dispatch(redirectTo(url));
    }, [dispatch, router]);

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
