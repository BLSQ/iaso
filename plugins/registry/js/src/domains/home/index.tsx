import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import { Box, Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { REGISTRY_BASE_URL } from '../../constants/urls';
import { MESSAGES } from './messages';
import { styles } from './styles';

export const Home = () => {
    const { formatMessage } = useSafeIntl();
    useEffect(() => {
        const link = document.createElement('link');
        link.href =
            'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);
    return (
        <>
            <Box sx={styles.background}>
                <Box sx={styles.ellipse1} />
                <Box sx={styles.ellipse2} />
                <Box sx={styles.ellipse3} />
                <Box sx={styles.ellipse4} />
                <Box sx={styles.ellipse5} />
                <Box sx={styles.round1} />
                <Box sx={styles.round2} />
                <Box sx={styles.round3} />
            </Box>
            <Box sx={styles.container}>
                <Grid container spacing={6}>
                    <Grid item xs={12} md={4}>
                        <Typography sx={styles.title} variant="h1">
                            <span
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{
                                    __html: formatMessage(MESSAGES.title),
                                }}
                            />
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={8} sx={styles.boxContainer}>
                        <Box sx={styles.blueBox}>
                            {formatMessage(MESSAGES.texte1)}
                            <Box sx={styles.link}>
                                <Link to={`/${REGISTRY_BASE_URL}`}>
                                    {formatMessage(MESSAGES.cta)}
                                    <ArrowCircleRightIcon sx={styles.arrow} />
                                </Link>
                            </Box>
                        </Box>
                        <Box mt={2} sx={styles.whiteBox}>
                            {formatMessage(MESSAGES.texte2)}
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
