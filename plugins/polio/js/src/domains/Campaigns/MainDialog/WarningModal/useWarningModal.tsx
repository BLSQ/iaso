import { useMemo, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';

type WarningModalProps = {
    title: string;
    body: string;
    dataTestId: string;
    closeWarning: () => void;
    isWarningOpen: boolean;
    setIsWarningOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useWarningModal = (
    dataTestId = 'warning-modal',
): WarningModalProps => {
    const { formatMessage } = useSafeIntl();
    const title = formatMessage(MESSAGES.scopeWarningTitle);
    const body = formatMessage(MESSAGES.scopesWillBeDeleted);
    const [isWarningOpen, setIsWarningOpen] = useState(false);

    return useMemo(() => {
        return {
            isWarningOpen,
            closeWarning: () => setIsWarningOpen(false),
            title,
            body,
            setIsWarningOpen,
            dataTestId,
        };
    }, [dataTestId, title, body, isWarningOpen, setIsWarningOpen]);
};
