import React, { FunctionComponent } from 'react';
import { Box, Typography, TypographyVariant } from '@mui/material';
import {
    useSafeIntl,
    LoadingSpinner,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';

import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import MESSAGES from '../messages';
import InstanceDetailsInfos from '../../components/InstanceDetailsInfos';
import InstanceDetailsLocation from '../../components/InstanceDetailsLocation';
import InstanceFileContent from '../../components/InstanceFileContent';
import { Instance } from '../../types/instance';
import InstancesFilesList from '../../components/InstancesFilesListComponent';
import { getInstancesFilesList } from '../../utils';
import { Accordion } from '../../../../components/Accordion/Accordion';
import { AccordionSummary } from '../../../../components/Accordion/AccordionSummary';
import { AccordionDetails } from '../../../../components/Accordion/AccordionDetails';

type Props = {
    data?: Instance;
    isLoading: boolean;
    isError: boolean;
    showTitle?: boolean;
    titleVariant?: TypographyVariant;
    height?: string | number;
};

const styles = {
    iconContainer: {
        display: 'inline-block',
        ml: 1,
        '& button a': {
            width: '30px',
            height: '30px',
        },
    },
};

export const InstanceDetailRaw: FunctionComponent<Props> = ({
    data,
    isLoading,
    isError,
    showTitle = true,
    titleVariant = 'h5',
    height = '70vh',
}) => {
    const { formatMessage } = useSafeIntl();

    if (isLoading)
        return (
            <Box height={height}>
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
                <Box display="flex" alignItems="center">
                    <Typography variant={titleVariant} color="secondary">
                        {`${formatMessage(MESSAGES.submissionTitle)} - ${
                            data?.id
                        }`}
                    </Typography>
                    <Box
                        display="inline-block"
                        ml={1}
                        sx={styles.iconContainer}
                    >
                        <IconButtonComponent
                            size="small"
                            iconSize="small"
                            url={`/forms/submission/instanceId/${data?.id}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewSubmissionDetails}
                        />
                    </Box>
                </Box>
            )}
            <Box>
                <Accordion defaultExpanded>
                    <AccordionSummary
                        aria-controls="instance-infos"
                        id="instance-infos"
                    >
                        {formatMessage(MESSAGES.infos)}
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box p={2}>
                            <InstanceDetailsInfos currentInstance={data} />
                        </Box>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary
                        aria-controls="instance-location"
                        id="instance-location"
                    >
                        {formatMessage(MESSAGES.location)}
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box p={2}>
                            <InstanceDetailsLocation currentInstance={data} />
                        </Box>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary
                        aria-controls="instance-form"
                        id="instance-form"
                    >
                        {formatMessage(MESSAGES.form)}
                    </AccordionSummary>
                    <AccordionDetails>
                        <InstanceFileContent instance={data} />
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary
                        aria-controls="instance-files"
                        id="instance-files"
                    >
                        {formatMessage(MESSAGES.files)}
                    </AccordionSummary>
                    <AccordionDetails>
                        <InstancesFilesList
                            fetchDetails={false}
                            instanceDetail={data}
                            files={getInstancesFilesList(data ? [data] : [])}
                        />
                    </AccordionDetails>
                </Accordion>
            </Box>
        </>
    );
};
