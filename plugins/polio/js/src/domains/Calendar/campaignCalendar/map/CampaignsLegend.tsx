import React, { FunctionComponent } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Grid,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import { vaccineOpacity } from '../Styles';
import { MappedCampaign } from '../types';

type Props = {
    campaigns: MappedCampaign[];
};

const styles: SxStyles = {
    title: {
        height: theme => theme.spacing(6),
        minHeight: theme => theme.spacing(6),
        '&.Mui-expanded': {
            minHeight: theme => theme.spacing(6),
        },
    },
    details: {
        paddingTop: 0,
    },
    mapLegendCampaigns: {
        width: 165,
    },
    mapLegendLabel: {
        textAlign: 'right',
    },
    roundColor: {
        margin: '4px 0',
        borderRadius: theme => theme.spacing(3),
        height: theme => theme.spacing(3),
        width: theme => theme.spacing(3),
        opacity: vaccineOpacity,
        // @ts-ignore
        border: theme => `2px solid ${theme.palette.ligthGray.border}`,
    },
    label: {
        overflow: 'hidden',
        whiteSpace: 'normal',
        width: '100%',
        justifyContent: 'flex-start',
        height: '100%',
        alignItems: 'center',
        display: 'flex',
        wordBreak: 'break-all',
    },
    mapLegendCampaignTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
};
export const CampaignsLegend: FunctionComponent<Props> = ({ campaigns }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Accordion elevation={1} sx={styles.mapLegendCampaigns}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={styles.title}>
                <Typography
                    variant="subtitle1"
                    sx={styles.mapLegendCampaignTitle}
                >
                    {formatMessage(MESSAGES.campaigns)}
                </Typography>
            </AccordionSummary>
            <AccordionDetails sx={styles.details}>
                <Box display="block">
                    {campaigns.length === 0 &&
                        formatMessage(MESSAGES.noCampaign)}
                    {campaigns.map(c => (
                        <Grid container spacing={0} key={c.id}>
                            <Grid
                                item
                                sm={3}
                                container
                                sx={styles.mapLegendLabel}
                                justifyContent="flex-start"
                            >
                                <Box
                                    sx={{
                                        ...styles.roundColor,
                                        borderColor: '#000000',
                                        backgroundColor: c.color,
                                    }}
                                />
                            </Grid>
                            <Grid item sm={9}>
                                <Box sx={styles.label}>{c.name}</Box>
                            </Grid>
                        </Grid>
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};
