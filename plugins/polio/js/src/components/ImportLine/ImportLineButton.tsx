import React, { FunctionComponent } from 'react';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { useSafeIntl } from 'bluesquare-components';
import { PageAction } from '../Buttons/PageAction';
import MESSAGES from '../../constants/messages';

type Props = { onClick: () => void };

export const ImportLineButton: FunctionComponent<Props> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <PageAction icon={CloudUploadIcon} onClick={onClick}>
            {formatMessage(MESSAGES.import)}
        </PageAction>
    );
};
