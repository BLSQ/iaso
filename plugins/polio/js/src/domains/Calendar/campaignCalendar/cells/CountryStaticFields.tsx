import React, { FunctionComponent } from 'react';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Box, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { SxStyles } from 'hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import { MappedCampaign } from '../types';

type Props = {
    campaign: MappedCampaign;
    subActivitiesExpanded?: boolean;
    setSubActivitiesExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
    hasSubActivities?: boolean;
};
const styles: SxStyles = {
    root: {
        position: 'absolute',
        left: 0,
        width: '100%',
        bottom: 0,
        height: '100%',
    },
    tooltipContainer: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        height: '100%',
        paddingLeft: 0.5,
        justifyContent: 'space-between',
    },
    tooltipCountryContainer: {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        fontSize: '0.50rem',
        textAlign: 'left',
    },
    country: {
        width: '100%',
        wordBreak: 'keep-all',
        lineHeight: 1.2,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textAlign: 'left',
    },
    countryContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontSize: '0.50rem',
        paddingLeft: 0.5,
        width: '100%',
        paddingRight: 0.5,
    },
    expandIconContainer: {
        width: 15,
    },
};
export const CountryStaticFields: FunctionComponent<Props> = ({
    campaign,
    subActivitiesExpanded,
    setSubActivitiesExpanded,
    hasSubActivities,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box
            sx={styles.root}
            onClick={() =>
                setSubActivitiesExpanded &&
                setSubActivitiesExpanded(!subActivitiesExpanded)
            }
        >
            {hasSubActivities ? (
                <Tooltip
                    arrow
                    placement="top"
                    TransitionProps={{ style: { marginBottom: '-3px' } }}
                    title={
                        !subActivitiesExpanded
                            ? formatMessage(MESSAGES.showSubactivities)
                            : formatMessage(MESSAGES.hideSubactivities)
                    }
                >
                    <Box sx={styles.tooltipContainer}>
                        <Box sx={styles.tooltipCountryContainer}>
                            <Box sx={styles.country}>{campaign.country}</Box>
                        </Box>
                        <Box sx={styles.expandIconContainer}>
                            {subActivitiesExpanded ? (
                                <ExpandLessIcon sx={{ fontSize: 16 }} />
                            ) : (
                                <ChevronRightIcon sx={{ fontSize: 16 }} />
                            )}
                        </Box>
                    </Box>
                </Tooltip>
            ) : (
                <Box sx={styles.countryContainer}>
                    <Box sx={styles.country}>{campaign.country}</Box>
                </Box>
            )}
        </Box>
    );
};
