import React, {
    FunctionComponent,
    useState,
    useMemo,
    useEffect,
    useCallback,
} from 'react';

import {
    Fullscreen,
    FullscreenExit,
    Rotate90DegreesCwOutlined,
    Rotate90DegreesCcwOutlined,
    ZoomIn,
    ZoomOut,
} from '@mui/icons-material';
import ArrowLeft from '@mui/icons-material/ArrowCircleLeftRounded';
import ArrowRight from '@mui/icons-material/ArrowCircleRightRounded';
import Close from '@mui/icons-material/Close';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { ShortFile } from 'Iaso/domains/instances/types/instance';
import { SxStyles } from 'Iaso/types/general';
import {
    MAX_ZOOM,
    MIN_ZOOM,
    useImageGalleryFullscreen,
} from './hooks/useImageGalleryFullscreen';
import { ImageGalleryLink } from './ImageGalleryLink';
import MESSAGES from './messages';

const FULLSCREEN_HORIZONTAL_PADDING = 120;
const FULLSCREEN_VERTICAL_PADDING = 200;

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
        '&.fullscreen': {
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
        },
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
        overflow: 'hidden',
        zIndex: 1,
        '&.fullscreen': {
            minWidth: '100vw',
            minHeight: '100vh',
            borderRadius: 0,
            backgroundColor: 'black',
            boxShadow: 'none',
        },
    },
    imageViewport: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
    },
    prevButton: {
        position: 'absolute',
        top: '50%',
        left: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
        zIndex: 3,
        ...whiteBg,
    },
    nextButton: {
        position: 'absolute',
        top: '50%',
        right: theme => theme.spacing(2),
        cursor: 'pointer',
        marginTop: '-35px',
        zIndex: 3,
        ...whiteBg,
    },
    closeButton: {
        position: 'absolute',
        top: theme => theme.spacing(2),
        right: theme => theme.spacing(2),
        cursor: 'pointer',
        zIndex: 3,
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
        zIndex: 3,
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
        zIndex: 2,
        '&.shiftForFullscreen': {
            maxWidth: 'calc(100% - 280px)',
            color: 'white',
        },
    },
    extra_infos: {
        position: 'absolute',
        color: 'white',
        top: theme => theme.spacing(0.5),
        right: theme => theme.spacing(1),
        zIndex: 2,
        '&.shiftForFullscreen': {
            top: theme => theme.spacing(2),
            right: theme => theme.spacing(10),
            color: 'white',
            '& .MuiButton-root, & .MuiButton-textPrimary': {
                color: 'white',
            },
            '& .MuiSvgIcon-root': {
                color: 'white',
            },
        },
    },
    actions: {
        position: 'absolute',
        bottom: theme => theme.spacing(0.5),
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        zIndex: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 1,
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
    isFullScreen: boolean,
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
        const horizontalPadding = isFullScreen
            ? FULLSCREEN_HORIZONTAL_PADDING
            : 4 * border;
        const verticalPadding = isFullScreen
            ? FULLSCREEN_VERTICAL_PADDING
            : 4 * border;
        const availableWidth = Math.max(windowWidth - horizontalPadding, 0);
        const availableHeight = Math.max(windowHeight - verticalPadding, 0);

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
    }, [
        naturalWidth,
        naturalHeight,
        isRotated,
        isFullScreen,
        windowWidth,
        windowHeight,
    ]);
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
    const { formatMessage } = useSafeIntl();
    const [naturalWidth, setNaturalWidth] = useState<number>(0);
    const [naturalHeight, setNaturalHeight] = useState<number>(0);
    const [rotation, setRotation] = useState(0);

    const currentImg = imageList[currentIndex];
    const currentImgSrc = currentImg?.path;
    const rotationMod = rotation % 180;
    const isRotated = rotationMod !== 0;
    const {
        overlayRef,
        isFullScreen,
        toggleFullScreen,
        closeGallery,
        zoom,
        offset,
        isDragging,
        viewportRef,
        zoomIn,
        zoomOut,
        resetZoom,
        handleMouseDown,
        handleDoubleClick,
    } = useImageGalleryFullscreen({ closeLightbox });

    const handleOnLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
        setNaturalWidth(width);
        setNaturalHeight(height);
    };
    const { containerWidth, containerHeight, imageWidth, imageHeight } =
        useImageSize(naturalWidth, naturalHeight, isRotated, isFullScreen);

    const goToIndex = useCallback(
        (index: number) => {
            setRotation(0);
            resetZoom();
            setCurrentIndex(index);
        },
        [resetZoom, setCurrentIndex],
    );

    if (!currentImg) return null;

    let imageCursor = 'default';
    if (isFullScreen && isDragging) {
        imageCursor = 'grabbing';
    } else if (isFullScreen && zoom > MIN_ZOOM) {
        imageCursor = 'grab';
    } else if (isFullScreen) {
        imageCursor = 'zoom-in';
    }

    return (
        <Box
            ref={overlayRef}
            sx={styles.overlay}
            className={isFullScreen ? 'fullscreen' : undefined}
            id="image-gallery-overlay"
            onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                if (
                    (event.target as HTMLElement).id === 'image-gallery-overlay'
                ) {
                    closeGallery();
                }
            }}
        >
            {currentIndex + 1 < imageList.length && (
                <IconButton
                    sx={styles.nextButton}
                    onClick={() => goToIndex(currentIndex + 1)}
                >
                    <ArrowRight sx={styles.navIcon} />
                </IconButton>
            )}
            {currentIndex + 1 > 1 && (
                <IconButton
                    sx={styles.prevButton}
                    onClick={() => goToIndex(currentIndex - 1)}
                >
                    <ArrowLeft sx={styles.navIcon} />
                </IconButton>
            )}
            <IconButton sx={styles.closeButton} onClick={closeGallery}>
                <Close sx={styles.closeIcon} />
            </IconButton>
            {currentIndex + 1 > 1 && (
                <Typography variant="h6" sx={styles.count}>
                    {`${currentIndex + 1} / ${imageList.length}`}
                </Typography>
            )}
            <Box
                sx={styles.content}
                className={isFullScreen ? 'fullscreen' : undefined}
                width={isFullScreen ? '100vw' : containerWidth}
                height={isFullScreen ? '100vh' : containerHeight}
            >
                <Box
                    ref={viewportRef}
                    sx={styles.imageViewport}
                    style={{
                        cursor: imageCursor,
                        touchAction: isFullScreen ? 'none' : 'auto',
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    }}
                    onMouseDown={handleMouseDown}
                    onDoubleClick={handleDoubleClick}
                >
                    <Box
                        component="img"
                        onLoad={handleOnLoad}
                        onDragStart={event => event.preventDefault()}
                        sx={{
                            width: imageWidth,
                            height: imageHeight,
                            transform: `rotate(${rotation}deg)`,
                        }}
                        alt=""
                        src={currentImgSrc}
                    />
                </Box>
                <ImageGalleryLink
                    url={url}
                    urlLabel={urlLabel}
                    isFullScreen={isFullScreen}
                />
                <Box
                    sx={styles.infos}
                    className={isFullScreen ? 'shiftForFullscreen' : undefined}
                >
                    {getInfos(currentImg)}
                </Box>
                <Box
                    sx={styles.extra_infos}
                    className={isFullScreen ? 'shiftForFullscreen' : undefined}
                >
                    {getExtraInfos(currentImg)}
                </Box>
                <Box sx={styles.actions}>
                    <IconButton onClick={() => setRotation(rotation - 90)}>
                        <Rotate90DegreesCcwOutlined />
                    </IconButton>
                    <IconButton onClick={() => setRotation(rotation + 90)}>
                        <Rotate90DegreesCwOutlined />
                    </IconButton>
                    {isFullScreen && (
                        <>
                            <Tooltip
                                arrow
                                title={formatMessage(MESSAGES.zoomOut)}
                            >
                                <span>
                                    <IconButton
                                        onClick={zoomOut}
                                        disabled={zoom <= MIN_ZOOM}
                                    >
                                        <ZoomOut />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip
                                arrow
                                title={formatMessage(MESSAGES.zoomIn)}
                            >
                                <span>
                                    <IconButton
                                        onClick={zoomIn}
                                        disabled={zoom >= MAX_ZOOM}
                                    >
                                        <ZoomIn />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </>
                    )}
                    <Tooltip
                        arrow
                        title={formatMessage(
                            isFullScreen
                                ? MESSAGES.exitFullscreen
                                : MESSAGES.fullscreen,
                        )}
                    >
                        <IconButton onClick={toggleFullScreen}>
                            {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );
};

export default ImageGallery;
