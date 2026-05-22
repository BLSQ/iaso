import React, { FunctionComponent, SetStateAction, useEffect } from 'react';
import InputComponent from 'Iaso/components/forms/InputComponent';
import MESSAGES from '../../../constants/messages';

type Props = {
    showIntegrated: boolean;
    setShowIntegrated: React.Dispatch<SetStateAction<boolean>>;
    hide: boolean;
};

export const IntegratedCampaignCheckbox: FunctionComponent<Props> = ({
    showIntegrated,
    setShowIntegrated,
    hide,
}) => {
    useEffect(() => {
        if (hide && showIntegrated) {
            setShowIntegrated(false);
        }
    }, [hide, setShowIntegrated, showIntegrated]);

    if (hide) return null;

    return (
        <InputComponent
            keyValue="showIntegrated"
            onChange={(_key, value) => {
                setShowIntegrated(value);
            }}
            value={showIntegrated}
            type="checkbox"
            label={MESSAGES.showIntegratedCampaigns}
        />
    );
};
