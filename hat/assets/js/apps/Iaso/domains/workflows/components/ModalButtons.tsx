import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton,
} from 'bluesquare-components';

import { Button, Box } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import PublishIcon from '@material-ui/icons/Publish';

import MESSAGES from '../messages';

type Props = {
    onClick: () => void;
};
export const AddButton: FunctionComponent<Props> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            color="primary"
            data-test="add-button"
            onClick={onClick}
            variant="contained"
        >
            <Box mr={1} top={3} position="relative">
                <AddIcon />
            </Box>
            {formatMessage(MESSAGES.add)}
        </Button>
    );
};

export const EditIconButton: FunctionComponent<Props> = ({ onClick }) => {
    return (
        <IconButton
            onClick={onClick}
            icon="edit"
            tooltipMessage={MESSAGES.edit}
        />
    );
};

export const PublishButton: FunctionComponent<Props> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            color="primary"
            data-test="save-name-button"
            onClick={onClick}
            variant="contained"
        >
            {formatMessage(MESSAGES.publish)}
        </Button>
    );
};

export const PublishIconButton: FunctionComponent<Props> = ({ onClick }) => {
    return (
        <IconButton
            onClick={onClick}
            overrideIcon={PublishIcon}
            tooltipMessage={MESSAGES.publish}
            color="inherit"
        />
    );
};
