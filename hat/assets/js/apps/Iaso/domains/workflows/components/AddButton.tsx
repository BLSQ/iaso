import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { Button, Box } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

import MESSAGES from '../messages';

type Props = {
    onClick: () => void;
};
export const ModalButton: FunctionComponent<Props> = ({ onClick }) => {
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
