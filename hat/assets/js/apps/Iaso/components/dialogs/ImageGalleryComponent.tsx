import React, { FunctionComponent, useState, useMemo, useEffect } from 'react';

import {
    Rotate90DegreesCwOutlined,
    Rotate90DegreesCcwOutlined,
} from '@mui/icons-material';
import ArrowLeft from '@mui/icons-material/ArrowCircleLeftRounded';
import ArrowRight from '@mui/icons-material/ArrowCircleRightRounded';
import Close from '@mui/icons-material/Close';

import { Box, IconButton, Typography } from '@mui/material';
import { ShortFile } from 'Iaso/domains/instances/types/instance';
import { SxStyles } from 'Iaso/types/general';
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

const styles: SxStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        backgroundColor: 'white',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: theme => theme.shadows[2],
        borderRadius: theme => theme.spacing(2),
        minWidth: '50vw',
    },
    prevButton: {
        position: 'absolute',
        top: '50%',
        left: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
        ...whiteBg,
    },
    nextButton: {
        position: 'absolute',
        top: '50%',
        right: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
        ...whiteBg,
    },
    closeButton: {
        position: 'absolute',
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
        position: 'absolute',
        bottom: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
        color: 'white',
    },
    infos: {
        position: 'absolute',
        top: theme => theme.spacing(0.5),
        left: theme => theme.spacing(2),
        width: '60%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    extra_infos: {
        position: 'absolute',
        color: 'white',
        top: theme => theme.spacing(0.5),
        right: theme => theme.spacing(1),
    },
    actions: {
        position: 'absolute',
        bottom: theme => theme.spacing(0.5),
        center: theme => theme.spacing(1),
    },
};

type Props = {
    closeLightbox: () => void;
    imageList: ShortFile[];
    currentIndex: number;
    setCurrentIndex?: (index: number) => void;
    url?: string | null;
    urlLabel?: { id: string; defaultMessage: string } | undefined;
    getInfos?: (image: ShortFile) => React.ReactNode;
    getExtraInfos?: (image: ShortFile) => React.ReactNode;
};

const border = 100;

const useWindowSize = (): { windowWidth: number; windowHeight: number } => {
    const [windowWidth, setWindowWidth] = useState<number>(
        typeof window !== 'undefined' ? window.innerWidth : 0,
    );
    const [windowHeight, setWindowHeight] = useState<number>(
        typeof window !== 'undefined' ? window.innerHeight : 0,
    );
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return { windowWidth, windowHeight };
};

const useImageSize = (
    naturalWidth: number,
    naturalHeight: number,
    isRotated: boolean,
): {
    containerWidth: number;
    containerHeight: number;
    imageWidth: number;
    imageHeight: number;
} => {
    const { windowWidth, windowHeight } = useWindowSize();
    return useMemo(() => {
        if (!naturalWidth || !naturalHeight || !windowWidth || !windowHeight) {
            return {
                containerWidth: 0,
                containerHeight: 0,
                imageWidth: 0,
                imageHeight: 0,
            };
        }
        const availableWidth = Math.max(windowWidth - 4 * border, 0);
        const availableHeight = Math.max(windowHeight - 4 * border, 0);

        const effectiveWidth = isRotated ? naturalHeight : naturalWidth;
        const effectiveHeight = isRotated ? naturalWidth : naturalHeight;

        const scale = Math.min(
            availableWidth / effectiveWidth,
            availableHeight / effectiveHeight,
        );

        const bboxWidth = effectiveWidth * scale;
        const bboxHeight = effectiveHeight * scale;

        const imgWidth = isRotated ? bboxHeight : bboxWidth;
        const imgHeight = isRotated ? bboxWidth : bboxHeight;

        return {
            containerWidth: bboxWidth + border,
            containerHeight: bboxHeight + border,
            imageWidth: imgWidth,
            imageHeight: imgHeight,
        };
    }, [naturalWidth, naturalHeight, isRotated, windowWidth, windowHeight]);
};

const ImageGallery: FunctionComponent<Props> = ({
    closeLightbox,
    imageList,
    currentIndex,
    setCurrentIndex = () => null,
    url,
    urlLabel,
    getInfos = () => null,
    getExtraInfos = () => null,
}) => {
    const [naturalWidth, setNaturalWidth] = useState<number>(0);
    const [naturalHeight, setNaturalHeight] = useState<number>(0);

    const [rotation, setRotation] = useState(0);

    const currentImg = imageList[currentIndex];
    const currentImgSrc = currentImg.path;

    const rotationMod = rotation % 180;
    const isRotated = rotationMod !== 0;
    const handleOnLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setNaturalWidth(naturalWidth);
        setNaturalHeight(naturalHeight);
    };
    const { containerWidth, containerHeight, imageWidth, imageHeight } =
        useImageSize(naturalWidth, naturalHeight, isRotated);
    if (!currentImg) return null;
    return (
        <Box
            sx={styles.overlay}
            id="image-gallery-overlay"
            onClick={e => {
                if ((e.target as HTMLElement).id === 'image-gallery-overlay') {
                    closeLightbox();
                }
            }}
        >
            {currentIndex + 1 < imageList.length && (
                <IconButton
                    sx={styles.nextButton}
                    onClick={() => {
                        setRotation(0);
                        setCurrentIndex(currentIndex + 1);
                    }}
                >
                    <ArrowRight sx={styles.navIcon} />
                </IconButton>
            )}
            {currentIndex + 1 > 1 && (
                <IconButton
                    sx={styles.prevButton}
                    onClick={() => {
                        setRotation(0);
                        setCurrentIndex(currentIndex - 1);
                    }}
                >
                    <ArrowLeft sx={styles.navIcon} />
                </IconButton>
            )}
            <IconButton sx={styles.closeButton} onClick={() => closeLightbox()}>
                <Close sx={styles.closeIcon} />
            </IconButton>
            {currentIndex + 1 > 1 && (
                <Typography variant="h6" sx={styles.count}>
                    {`${currentIndex + 1} / ${imageList.length}`}
                </Typography>
            )}
            <Box
                sx={styles.content}
                width={containerWidth}
                height={containerHeight}
            >
                <Box
                    component="img"
                    onLoad={handleOnLoad}
                    sx={{
                        width: imageWidth,
                        height: imageHeight,
                        transform: `rotate(${rotation}deg)`,
                    }}
                    alt=""
                    src={currentImgSrc}
                />
                <ImageGalleryLink url={url} urlLabel={urlLabel} />
                <Box sx={styles.infos}>{getInfos(currentImg)}</Box>
                <Box sx={styles.extra_infos}>{getExtraInfos(currentImg)}</Box>
                <Box sx={styles.actions}>
                    <IconButton onClick={() => setRotation(rotation - 90)}>
                        <Rotate90DegreesCcwOutlined />
                    </IconButton>
                    <IconButton onClick={() => setRotation(rotation + 90)}>
                        <Rotate90DegreesCwOutlined />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
};

export default ImageGallery;
