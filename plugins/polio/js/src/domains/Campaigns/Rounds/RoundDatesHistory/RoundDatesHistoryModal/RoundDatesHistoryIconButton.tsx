import React, { FunctionComponent } from 'react';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { IconButton } from 'bluesquare-components';
import MESSAGES from '../../../../../constants/messages';

type IconButtonProps = {
    onClick: () => void;
    dataTestId?: string;
};

export const RoundDatesHistoryIconButton: FunctionComponent<IconButtonProps> =
    ({ onClick, dataTestId = 'roundHistoryButton' }) => {
        return (
            <IconButton
                dataTestId={dataTestId}
                onClick={onClick}
                overrideIcon={InfoOutlinedIcon}
                tooltipMessage={MESSAGES.seeHistory}
            />
        );
    };
