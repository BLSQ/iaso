import React, { FunctionComponent } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    useSafeIntl,
    LoadingSpinner,
    IntlFormatMessage,
    IntlMessage,
} from 'bluesquare-components';

import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import { FileContent } from '../../types/instance';
import MESSAGES from '../messages';
import {
    EMPTY_FORMATTED_INSTANCE_LOG,
    FormattedInstanceLog,
    hasInstanceLogContent,
} from '../utils/formattedInstanceLog';
import { InstanceLogContentBasic } from './InstanceLogContentBasic';

type Props = {
    instanceLogContent: FormattedInstanceLog | null | undefined;
    isLogDetailLoading: boolean;
    isLogDetailError: boolean;
    headerA?: IntlMessage;
    headerB?: IntlMessage;
    tableMaxHeight?: string;
    emptyPlaceholder?: IntlMessage;
};

export const InstanceLogDetail: FunctionComponent<Props> = ({
    instanceLogContent,
    isLogDetailLoading,
    isLogDetailError,
    headerA,
    headerB,
    tableMaxHeight,
    emptyPlaceholder = MESSAGES.emptyLogContent,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const showContent =
        !isLogDetailLoading &&
        !isLogDetailError &&
        hasInstanceLogContent(instanceLogContent);
    const showEmptyShell =
        !isLogDetailLoading &&
        !isLogDetailError &&
        !hasInstanceLogContent(instanceLogContent);

    return (
        <>
            {isLogDetailError && (
                <ErrorPaperComponent
                    message={formatMessage(MESSAGES.errorLog)}
                />
            )}
            <Paper>
                {isLogDetailLoading && (
                    <Box height="30vh">
                        <LoadingSpinner
                            fixed={false}
                            transparent
                            padding={4}
                            size={25}
                        />
                    </Box>
                )}
                {showContent && (
                    <InstanceLogContentBasic
                        fileContent={instanceLogContent as FileContent}
                        headerA={headerA}
                        headerB={headerB}
                        tableMaxHeight={tableMaxHeight}
                    />
                )}
                {showEmptyShell && (
                    <>
                        <InstanceLogContentBasic
                            fileContent={
                                EMPTY_FORMATTED_INSTANCE_LOG as FileContent
                            }
                            headerA={headerA}
                            headerB={headerB}
                            tableMaxHeight={tableMaxHeight}
                        />
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 'bold' }}>
                                {formatMessage(emptyPlaceholder)}
                            </Typography>
                        </Box>
                    </>
                )}
            </Paper>
        </>
    );
};
