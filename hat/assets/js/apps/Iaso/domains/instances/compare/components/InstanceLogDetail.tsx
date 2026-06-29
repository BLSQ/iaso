import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@mui/material';
import {
    useSafeIntl,
    LoadingSpinner,
    IntlFormatMessage,
    IntlMessage,
} from 'bluesquare-components';

import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';

import MESSAGES from '../messages';
import { InstanceLogContentBasic } from './InstanceLogContentBasic';

type Props = {
    instanceLogContent: any;
    isLogDetailLoading: boolean;
    isLogDetailError: boolean;
    headerA?: IntlMessage;
    headerB?: IntlMessage;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({
    instanceLogContent,
    isLogDetailLoading,
    isLogDetailError,
    headerA,
    headerB,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const hasError = isLogDetailError;
    const isLoading = isLogDetailLoading;
    return (
        <>
            {hasError && (
                <ErrorPaperComponent
                    message={formatMessage(MESSAGES.errorLog)}
                />
            )}
            <Paper>
                {isLoading && (
                    <Box height="30vh">
                        <LoadingSpinner
                            fixed={false}
                            transparent
                            padding={4}
                            size={25}
                        />
                    </Box>
                )}
                {!hasError && !isLoading && instanceLogContent && (
                    <InstanceLogContentBasic
                        fileContent={instanceLogContent}
                        headerA={headerA}
                        headerB={headerB}
                    />
                )}
            </Paper>
        </>
    );
};
