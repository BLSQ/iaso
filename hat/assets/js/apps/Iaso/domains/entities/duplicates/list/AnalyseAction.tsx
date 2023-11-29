import React, { FunctionComponent, useCallback } from 'react';
import moment from 'moment';
import { Box, Tooltip } from '@material-ui/core';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

import { useSafeIntl } from 'bluesquare-components';
import { AnalysisTooltipTitle } from './AnalysisTooltipTitle';
import MESSAGES from '../messages';
import { Analysis } from '../types';
import { AnalysisModal } from './AnalysisModal';

type Props = {
    latestAnalysis: Analysis | undefined;
    isFetchingLatestAnalysis: boolean;
};

export const AnalyseAction: FunctionComponent<Props> = ({
    latestAnalysis,
    isFetchingLatestAnalysis,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Box minHeight={36} display="flex" width="100%">
            {!latestAnalysis &&
                !isFetchingLatestAnalysis &&
                formatMessage(MESSAGES.noAnalysis)}
            {latestAnalysis && (
                <>
                    <Box mr="auto">
                        <Box display="flex" alignItems="center">
                            <Box display="inline-block" mr={1}>
                                {latestAnalysis.finished_at &&
                                    formatMessage(MESSAGES.latestAnalysis, {
                                        finishedAt: moment(
                                            latestAnalysis.finished_at,
                                        ).format('LTS'),
                                    })}
                                {!latestAnalysis.finished_at &&
                                    formatMessage(MESSAGES.analysisBusy)}
                            </Box>
                            <Tooltip
                                arrow
                                title={
                                    <AnalysisTooltipTitle
                                        analysis={latestAnalysis}
                                    />
                                }
                            >
                                <InfoOutlinedIcon
                                    style={{ cursor: 'pointer' }}
                                />
                            </Tooltip>
                        </Box>
                    </Box>
                    <AnalysisModal iconProps={{}} />
                </>
            )}
        </Box>
    );
};
