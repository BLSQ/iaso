import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import { Box, Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import DHIS2Svg from '../../../../../../hat/assets/js/apps/Iaso/components/svg/DHIS2SvgComponent';
import blsqLogo from '../../../images/blsq.png';
import datavizLogo from '../../../images/dataviz.png';
import dhis2Logo from '../../../images/dhis2.png';
import enabelLogo from '../../../images/enabel.png';

import logo from '../../../images/logo.jpg';
import { REGISTRY_BASE_URL } from '../../constants/urls';
import { MESSAGES } from './messages';
import { primaryColor, secondaryColor, styles } from './styles';

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
                <Box sx={styles.content}>
                    <Grid container spacing={6}>
                        <Grid item xs={12} sm={4}>
                            <Box sx={styles.logoContainer}>
                                <Box sx={styles.logo}>
                                    <img
                                        src={`${window.STATIC_URL}${logo}`}
                                        alt="logo"
                                    />
                                </Box>
                                <span>{formatMessage(MESSAGES.logoText)}</span>
                            </Box>
                            <Typography sx={styles.title} variant="h1">
                                <span
                                    // eslint-disable-next-line react/no-danger
                                    dangerouslySetInnerHTML={{
                                        __html: formatMessage(MESSAGES.title),
                                    }}
                                />
                            </Typography>
                            <Box sx={styles.boxLinkContainer}>
                                <a
                                    href="http://dhisniger.ne/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Box
                                        sx={{
                                            ...styles.boxLink,
                                            backgroundColor: primaryColor,
                                        }}
                                    >
                                        <Box>
                                            <DHIS2Svg />
                                            {formatMessage(MESSAGES.dhis2)}
                                        </Box>
                                    </Box>
                                </a>
                                <a
                                    href="https://www.sante.gouvne.org/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Box
                                        sx={{
                                            ...styles.boxLink,
                                            backgroundColor: secondaryColor,
                                        }}
                                    >
                                        <Box>
                                            <MedicalInformationIcon />
                                            {formatMessage(MESSAGES.sante)}
                                        </Box>
                                    </Box>
                                </a>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={8} sx={styles.boxContainer}>
                            <Box sx={styles.blueBox}>
                                {formatMessage(MESSAGES.texte1)}
                                <Box sx={styles.link}>
                                    <Link to={`/${REGISTRY_BASE_URL}`}>
                                        {formatMessage(MESSAGES.cta)}
                                        <ArrowCircleRightIcon
                                            sx={styles.arrow}
                                        />
                                    </Link>
                                </Box>
                            </Box>
                            <Box mt={2} sx={styles.whiteBox}>
                                {formatMessage(MESSAGES.texte2)}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                <Box sx={styles.footer}>
                    <Grid container spacing={6}>
                        <Grid item xs={12} sm={4}>
                            <Typography sx={styles.footerText}>
                                {formatMessage(MESSAGES.footer)}
                                <a href="mailto:">
                                    {formatMessage(MESSAGES.footerLink)}
                                </a>
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography sx={styles.footerTitle}>
                                {formatMessage(MESSAGES.footerTitle1)}
                            </Typography>
                            <Box sx={styles.footerBox}>
                                <a
                                    href="https://www.enabel.be"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Box sx={styles.footerBoxImage}>
                                        <img
                                            src={`${window.STATIC_URL}${enabelLogo}`}
                                            alt="logo-enabel"
                                        />
                                    </Box>
                                </a>
                                <a
                                    href="https://www.bluesquarehub.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Box sx={styles.footerBoxImage}>
                                        <img
                                            src={`${window.STATIC_URL}${blsqLogo}`}
                                            alt="logo-blsq"
                                        />
                                    </Box>
                                </a>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Typography sx={styles.footerTitle}>
                                {formatMessage(MESSAGES.footerTitle2)}
                            </Typography>
                            <Box sx={styles.footerBox}>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://www.bluesquarehub.com/dataviz/"
                                >
                                    <Box sx={styles.footerBoxImage}>
                                        <img
                                            src={`${window.STATIC_URL}${datavizLogo}`}
                                            alt="logo-dataviz"
                                        />
                                    </Box>
                                </a>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href="https://dhis2.org/"
                                >
                                    <Box sx={styles.footerBoxImage}>
                                        <img
                                            src={`${window.STATIC_URL}${dhis2Logo}`}
                                            alt="logo-dhis2"
                                        />
                                    </Box>
                                </a>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
