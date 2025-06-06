import React, { FunctionComponent } from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { NumberCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';
import MESSAGES from '../messages';

type Props = {
    totalVials: number;
    totalDoses: number;
    earmarkedVials?: number;
    earmarkedDoses?: number;
    tab: 'usable' | 'unusable';
};

export const VialsSummary: FunctionComponent<Props> = ({
    totalVials,
    totalDoses,
    earmarkedVials,
    earmarkedDoses,
    tab,
}) => {
    const { formatMessage } = useSafeIntl();
    const vialsSubtitle =
        tab === 'usable'
            ? formatMessage(MESSAGES.totalUsableVials)
            : formatMessage(MESSAGES.totalUnusableVials);
    const dosesSubtitle =
        tab === 'usable'
            ? formatMessage(MESSAGES.totalUsableDoses)
            : formatMessage(MESSAGES.totalUnusableDoses);
    const earmarkedVialsSubTitle = formatMessage(MESSAGES.totalEarmarkedVials);
    const earmarkedDosesSubTitle = formatMessage(MESSAGES.totalEarmarkedDoses);
    return (
        <Box ml={3} my={4}>
            <Paper elevation={0} sx={{ border: 'none' }}>
                <Grid container justifyContent="flex-start" spacing={2}>
                    <Grid item sx={{ textAlign: 'center' }}>
                        <Typography
                            sx={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: '#808080',
                            }}
                        >
                            <NumberCell value={totalVials} />
                        </Typography>
                        <Typography sx={{ color: '#808080' }}>
                            {vialsSubtitle}
                        </Typography>
                    </Grid>
                    <Grid item sx={{ textAlign: 'center' }}>
                        <Typography
                            sx={{
                                fontSize: '32px',
                                fontWeight: 'bold',
                                color: '#808080',
                            }}
                        >
                            <NumberCell value={totalDoses} />
                        </Typography>
                        <Typography sx={{ color: '#808080' }}>
                            {dosesSubtitle}
                        </Typography>
                    </Grid>
                    {tab === 'usable' && (
                        <>
                            <Grid item sx={{ textAlign: 'center' }}>
                                <Typography
                                    sx={{
                                        fontSize: '32px',
                                        fontWeight: 'bold',
                                        color: '#808080',
                                    }}
                                >
                                    <NumberCell value={earmarkedVials} />
                                </Typography>
                                <Typography sx={{ color: '#808080' }}>
                                    {earmarkedVialsSubTitle}
                                </Typography>
                            </Grid>
                            <Grid item sx={{ textAlign: 'center' }}>
                                <Typography
                                    sx={{
                                        fontSize: '32px',
                                        fontWeight: 'bold',
                                        color: '#808080',
                                    }}
                                >
                                    <NumberCell value={earmarkedDoses} />
                                </Typography>
                                <Typography sx={{ color: '#808080' }}>
                                    {earmarkedDosesSubTitle}
                                </Typography>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Paper>
        </Box>
    );
};
