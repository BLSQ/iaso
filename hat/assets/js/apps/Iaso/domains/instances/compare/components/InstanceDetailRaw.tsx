import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import MESSAGES from '../messages';
import InstanceDetailsInfos from '../../components/InstanceDetailsInfos';
import InstanceDetailsLocation from '../../components/InstanceDetailsLocation';
import InstanceFileContent from '../../components/InstanceFileContent';
import { Instance } from '../../types/instance';

type Props = {
    data?: Instance;
    isLoading: boolean;
    isError: boolean;
    showTitle?: boolean;
    elevation?: number;
};

export const InstanceDetailRaw: FunctionComponent<Props> = ({
    data,
    isLoading,
    isError,
    showTitle = true,
    elevation = 1,
}) => {
    const { formatMessage } = useSafeIntl();
    if (isLoading)
        return (
            <Box height="70vh">
                <LoadingSpinner
                    fixed={false}
                    transparent
                    padding={4}
                    size={25}
                />
            </Box>
        );
    if (isError) {
        return <ErrorPaperComponent message={formatMessage(MESSAGES.error)} />;
    }
    return (
        <>
            {showTitle && (
                <Box mb={4}>
                    <Typography variant="h5" color="secondary">
                        {`${formatMessage(MESSAGES.submissionTitle)} - ${
                            data?.id
                        }`}
                    </Typography>
                </Box>
            )}
            <WidgetPaper
                expandable
                isExpanded={false}
                title={formatMessage(MESSAGES.infos)}
                padded
                elevation={elevation}
            >
                <InstanceDetailsInfos currentInstance={data} />
            </WidgetPaper>
            <WidgetPaper
                expandable
                isExpanded={false}
                title={formatMessage(MESSAGES.location)}
                elevation={elevation}
            >
                <InstanceDetailsLocation currentInstance={data} />
            </WidgetPaper>
            <WidgetPaper
                title={formatMessage(MESSAGES.form)}
                elevation={elevation}
            >
                <InstanceFileContent instance={data} />
            </WidgetPaper>
        </>
    );
};
