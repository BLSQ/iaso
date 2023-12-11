import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    useSafeIntl,
    LoadingSpinner,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import MESSAGES from '../messages';
import InstanceDetailsInfos from '../../components/InstanceDetailsInfos';
import InstanceDetailsLocation from '../../components/InstanceDetailsLocation';
import InstanceFileContent from '../../components/InstanceFileContent';
import { Instance } from '../../types/instance';
import { Link } from 'react-router';

const useStyles = makeStyles({
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
    },
});

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
    const classes = useStyles();

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
                        <section>
                            {`${formatMessage(MESSAGES.submissionTitle)} - ${
                                data?.id
                            }`}
                            <IconButtonComponent
                                url={`/forms/submission/instanceId/${data?.id}`}
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.viewSubmissionDetails}
                            />
                        </section>
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
