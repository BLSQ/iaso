import React, { FunctionComponent } from 'react';
import PublishIcon from '@mui/icons-material/Publish';
import { IconButton } from 'bluesquare-components';
import MESSAGES from '../../messages';

type Props = {
    onClick: () => void;
    disabled: false;
};

export const CreateSubmissionModalButton: FunctionComponent<Props> = ({
    onClick,
    disabled = false,
}) => {
    return (
        <IconButton
            onClick={onClick}
            disabled={disabled}
            overrideIcon={PublishIcon}
            tooltipMessage={MESSAGES.addSubmissionForForm}
        />
    );
};
