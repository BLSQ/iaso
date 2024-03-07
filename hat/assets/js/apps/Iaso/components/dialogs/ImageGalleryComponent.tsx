import React, { FunctionComponent } from 'react';

import ArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import ArrowRight from '@mui/icons-material/KeyboardArrowRight';
import Close from '@mui/icons-material/Close';

import {
    Box,
    Dialog,
    DialogContent,
    IconButton,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Link } from 'react-router';
import { ShortFile } from '../../domains/instances/types/instance';
import MESSAGES from './messages';

const styles = {
    paper: {
        boxShadow: 'none',
        backgroundColor: 'transparent',
        borderRadius: 0,
        width: '80%',
    },
    content: {
        padding: '2vh !important',
        borderRadius: 0,
        height: '90vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '110%',
        height: '95%',
        objectFit: 'contain' as const, // Explicitly cast the string to the 'contain' literal type
        maxWidth: '80vw',
    },
    prevButton: {
        position: 'fixed',
        top: '50%',
        left: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
    },
    nextButton: {
        position: 'fixed',
        top: '50%',
        right: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
    },
    closeButton: {
        position: 'fixed',
        top: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
        cursor: 'pointer',
    },
    navIcon: {
        fontSize: '50px',
        color: 'white',
    },
    closeIcon: {
        fontSize: '30px',
        color: 'white',
    },
    count: {
        color: 'white',
        position: 'fixed',
        bottom: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
    },
    infos: {
        color: 'white',
        position: 'absolute',
        top: theme => theme.spacing(1),
        right: theme => theme.spacing(1),
    },
};

type Props = {
    closeLightbox: () => void;
    imageList: ShortFile[];
    currentIndex: number;
    // eslint-disable-next-line no-unused-vars
    setCurrentIndex: (index: number) => void;
    link: any;
    // eslint-disable-next-line no-unused-vars
    getExtraInfos?: (image: ShortFile) => React.ReactNode;
};

const ImageGallery: FunctionComponent<Props> = ({
    closeLightbox,
    imageList,
    currentIndex,
    setCurrentIndex,
    link,
    getExtraInfos = () => null,
}) => {
    const currentImg = imageList[currentIndex];
    if (!currentImg) return null;
    const currentImgSrc = currentImg.path;

    return (
        <>
            <Dialog
                classes={{
                    paper: styles.paper as any,
                }}
                open
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') {
                        closeLightbox();
                    }
                }}
                maxWidth="xl"
            >
                <DialogContent sx={styles.content}>
                    {currentIndex > 0 && (
                        <IconButton
                            color="primary"
                            sx={styles.prevButton}
                            onClick={() => setCurrentIndex(currentIndex - 1)}
                        >
                            <ArrowLeft sx={styles.navIcon} />
                        </IconButton>
                    )}
                    {currentIndex + 1 < imageList.length && (
                        <IconButton
                            color="primary"
                            sx={styles.nextButton}
                            onClick={() => setCurrentIndex(currentIndex + 1)}
                        >
                            <ArrowRight sx={styles.navIcon} />
                        </IconButton>
                    )}
                    <IconButton
                        color="primary"
                        sx={styles.closeButton}
                        onClick={() => closeLightbox()}
                    >
                        <Close sx={styles.closeIcon} />
                    </IconButton>
                    {link}
                    <Box sx={styles.infos}>{getExtraInfos(currentImg)}</Box>
                    <Typography color="primary" variant="h6" sx={styles.count}>
                        {`${currentIndex + 1} / ${imageList.length}`}
                    </Typography>
                    <img style={styles.image} alt="" src={currentImgSrc} />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ImageGallery;
