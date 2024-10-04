import React, { FunctionComponent } from 'react';

import ArrowLeft from '@mui/icons-material/ArrowCircleLeftRounded';
import ArrowRight from '@mui/icons-material/ArrowCircleRightRounded';
import Close from '@mui/icons-material/Close';

import {
    Box,
    Dialog,
    DialogContent,
    IconButton,
    Typography,
} from '@mui/material';
import { ShortFile } from '../../domains/instances/types/instance';
import { ImageGalleryLink } from './ImageGalleryLink';

const whiteBg = {
    '&:before': {
        zIndex: -1,
        content: '""',
        position: 'absolute',
        top: '18px',
        left: '18px',
        width: '30px',
        height: '30px',
        borderRadius: '100%',
        backgroundColor: 'white',
    },
};

const styles = {
    paper: {
        boxShadow: 'none',
        backgroundColor: 'transparent',
        borderRadius: 0,
        width: '80%',
    },
    content: {
        padding: theme => theme.spacing(5, 2, 5, 2),
        borderRadius: 0,
        height: '90vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 'auto',
        height: '100%',
        objectFit: 'contain' as const, // Explicitly cast the string to the 'contain' literal type
        maxWidth: '80vw',
    },
    prevButton: {
        position: 'fixed',
        top: '50%',
        left: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
        ...whiteBg,
    },
    nextButton: {
        position: 'fixed',
        top: '50%',
        right: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
        ...whiteBg,
    },
    closeButton: {
        position: 'fixed',
        top: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
        cursor: 'pointer',
        backgroundColor: theme => theme.palette.secondary.main,
        '&:hover': {
            backgroundColor: theme => theme.palette.secondary.dark,
        },
    },
    navIcon: {
        fontSize: '50px',
        color: theme => theme.palette.secondary.main,
        '&:hover': {
            color: theme => theme.palette.secondary.dark,
        },
    },
    closeIcon: {
        fontSize: '30px',
        color: 'white',
    },
    count: {
        position: 'fixed',
        bottom: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
        color: 'white',
    },
    infos: {
        color: 'white',
        position: 'absolute',
        top: theme => theme.spacing(0.5),
        right: theme => theme.spacing(1),
    },
};

type Props = {
    closeLightbox: () => void;
    imageList: ShortFile[];
    currentIndex: number;
    setCurrentIndex?: (index: number) => void;
    url?: string | null;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
    getExtraInfos?: (image: ShortFile) => React.ReactNode;
};

const ImageGallery: FunctionComponent<Props> = ({
    closeLightbox,
    imageList,
    currentIndex,
    setCurrentIndex = () => null,
    url,
    urlLabel,
    getExtraInfos = () => null,
}) => {
    const currentImg = imageList[currentIndex];
    if (!currentImg) return null;
    const currentImgSrc = currentImg.path;

    return (
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
                        sx={styles.prevButton}
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                    >
                        <ArrowLeft sx={styles.navIcon} />
                    </IconButton>
                )}
                {currentIndex + 1 < imageList.length && (
                    <IconButton
                        sx={styles.nextButton}
                        onClick={() => setCurrentIndex(currentIndex + 1)}
                    >
                        <ArrowRight sx={styles.navIcon} />
                    </IconButton>
                )}
                <IconButton
                    sx={styles.closeButton}
                    onClick={() => closeLightbox()}
                >
                    <Close sx={styles.closeIcon} />
                </IconButton>
                <ImageGalleryLink url={url} urlLabel={urlLabel} />
                <Box sx={styles.infos}>{getExtraInfos(currentImg)}</Box>
                {currentIndex + 1 > 1 && (
                    <Typography variant="h6" sx={styles.count}>
                        {`${currentIndex + 1} / ${imageList.length}`}
                    </Typography>
                )}
                <img style={styles.image} alt="" src={currentImgSrc} />
            </DialogContent>
        </Dialog>
    );
};

export default ImageGallery;
