import React, { FunctionComponent } from 'react';
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { TabValue } from '../types';

type Props = {
    tab: TabValue;
    onCancel: () => void;
    className: string;
    onSubmitTab: () => void;
    onSubmitAll: () => void;
    allowSaveTab: boolean;
    allowSaveAll: boolean;
    showSaveAllButton?: boolean;
};

export const VaccineSupplyChainConfirmButtons: FunctionComponent<Props> = ({
    className,
    tab,
    onSubmitTab,
    onSubmitAll,
    onCancel,
    allowSaveTab,
    allowSaveAll,
    showSaveAllButton = true,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Box ml={2} mt={4}>
                <Button
                    variant="contained"
                    className={className}
                    color="primary"
                    onClick={onCancel}
                >
                    {formatMessage(MESSAGES.cancel)}
                </Button>
            </Box>
            <Box ml={2} mt={4}>
                <Button
                    variant="contained"
                    className={className}
                    color="primary"
                    onClick={onSubmitTab}
                    disabled={!allowSaveTab}
                >
                    {`${formatMessage(MESSAGES.save)} ${formatMessage(
                        MESSAGES[tab],
                    )}`}
                </Button>
            </Box>
            {showSaveAllButton && (
                <Box ml={2} mt={4}>
                    <Button
                        variant="contained"
                        className={className}
                        color="primary"
                        disabled={!allowSaveAll}
                        onClick={onSubmitAll}
                    >
                        {formatMessage(MESSAGES.saveAll)}
                    </Button>
                </Box>
            )}
        </>
    );
};
