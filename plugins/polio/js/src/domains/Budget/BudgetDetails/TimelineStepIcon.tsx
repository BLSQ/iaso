import React, { FunctionComponent } from 'react';
import { CheckCircleOutline } from '@mui/icons-material';
import FastForwardIcon from '@mui/icons-material/FastForward';
import ClearIcon from '@mui/icons-material/Clear';
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import { Tooltip } from '@mui/material';
import { Item } from '../types';
import MESSAGES from '../../../constants/messages';
import { useStyles } from './styles';

type Props = {
    item: Item;
};

export const TimelineStepIcon: FunctionComponent<Props> = ({ item }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    if (item.skipped)
        return (
            <Tooltip
                arrow
                placement="top"
                title={formatMessage(MESSAGES.stepSkipped)}
            >
                <FastForwardIcon
                    className={classnames(
                        classes.taskIcon,
                        classes.overrideIcon,
                    )}
                />
            </Tooltip>
        );
    if (item.cancelled)
        return (
            <Tooltip
                arrow
                placement="top"
                title={formatMessage(MESSAGES.stepCancelled)}
            >
                <ClearIcon
                    className={classnames(
                        classes.taskIcon,
                        classes.overrideIcon,
                    )}
                />
            </Tooltip>
        );
    return (
        <CheckCircleOutline
            className={classnames(
                item.performed_by && classes.taskDone,
                !item.performed_by && classes.taskPending,
                classes.taskIcon,
            )}
        />
    );
};
