import { Box, Typography, TypographyVariant } from '@mui/material';
import {
    IconButton as IconButtonComponent,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

import { Accordion } from '../../../../components/Accordion/Accordion';
import { AccordionDetails } from '../../../../components/Accordion/AccordionDetails';
import { AccordionSummary } from '../../../../components/Accordion/AccordionSummary';
import ErrorPaperComponent from '../../../../components/papers/ErrorPaperComponent';
import { baseUrls } from '../../../../constants/urls';
import InstanceDetailsInfos from '../../components/InstanceDetailsInfos';
import InstanceDetailsLocation from '../../components/InstanceDetailsLocation';
import InstanceFileContent from '../../components/InstanceFileContent';
import InstancesFilesList from '../../components/InstancesFilesListComponent';
import { Instance } from '../../types/instance';
import { getInstancesFilesList } from '../../utils';
import MESSAGES from '../messages';
import { INSTANCE_METAS_FIELDS } from '../../constants';

type Props = {
    data?: Instance;
    isLoading: boolean;
    isError: boolean;
    showTitle?: boolean;
    titleVariant?: TypographyVariant;
    height?: string | number;
    titleColor?: string;
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
    titleColor = 'secondary',
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
                    <Typography variant={titleVariant} color={titleColor}>
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
                            url={`/${baseUrls.instanceDetail}/instanceId/${data?.id}`}
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
                            <InstanceDetailsInfos
                                instance_metas_fields={INSTANCE_METAS_FIELDS}
                                currentInstance={data}
                            />
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
