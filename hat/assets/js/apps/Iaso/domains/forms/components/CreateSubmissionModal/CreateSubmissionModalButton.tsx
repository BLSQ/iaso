import React, { FunctionComponent } from 'react';
import { IconButton } from 'bluesquare-components';
import PublishIcon from '@mui/icons-material/Publish';
import MESSAGES from '../../messages';

type Props = { onClick: () => void };

export const CreateSubmissionModalButton: FunctionComponent<Props> = ({
    onClick,
}) => {
    return (
        <IconButton
            onClick={onClick}
            overrideIcon={PublishIcon}
            tooltipMessage={MESSAGES.addSubmissionForForm}
        />
    );
};
