import React, { FunctionComponent } from 'react';
import { Block, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../types/general';
import { QUESTION_STATUS_MESSAGES } from '../config';
import { QuestionStatus } from '../types';

const styles: SxStyles = {
    icon: {
        flex: '0 0 auto',
        fontSize: 16,
    },
};

const STATUS_ICONS = {
    [QuestionStatus.MAPPED]: { Icon: CheckCircle, color: 'success.main' },
    [QuestionStatus.UNMAPPED]: {
        Icon: RadioButtonUnchecked,
        color: 'text.disabled',
    },
    [QuestionStatus.NEVER]: { Icon: Block, color: 'gray.main' },
};

type Props = {
    status: QuestionStatus;
    // next to a text already naming the status
    decorative?: boolean;
};

export const QuestionStatusIcon: FunctionComponent<Props> = ({
    status,
    decorative = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const { Icon, color } = STATUS_ICONS[status];
    if (decorative) {
        return <Icon sx={{ ...styles.icon, color }} />;
    }
    return (
        <Icon
            sx={{ ...styles.icon, color }}
            titleAccess={formatMessage(QUESTION_STATUS_MESSAGES[status])}
        />
    );
};
