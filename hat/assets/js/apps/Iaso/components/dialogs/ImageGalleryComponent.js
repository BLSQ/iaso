import React from 'react';

import PropTypes from 'prop-types';
import ArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import ArrowRight from '@mui/icons-material/KeyboardArrowRight';
import Close from '@mui/icons-material/Close';

import { Dialog, DialogContent, IconButton, Typography } from '@mui/material';
import { withStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';

const styles = theme => ({
    ...commonStyles(theme),
    paper: {
        boxShadow: 'none',
        backgroundColor: 'transparent',
        borderRadius: 0,
        width: '80%',
    },
    content: {
        padding: '0 !important',
        borderRadius: 0,
        height: '90vh',
        overflow: 'hidden',
    },
    image: {
        width: '110%',
        height: '95%',
        objectFit: 'contain',
        maxWidth: '80vw',
    },
    prevButton: {
        position: 'fixed',
        top: '50%',
        left: theme.spacing(2),
        cursor: 'pointer',
        marginTop: -35,
    },
    nextButton: {
        position: 'fixed',
        top: '50%',
        right: theme.spacing(2),
        cursor: 'pointer',
        marginTop: -35,
    },
    closeButton: {
        position: 'fixed',
        top: theme.spacing(2),
        right: theme.spacing(2),
        cursor: 'pointer',
    },
    navIcon: {
        fontSize: 50,
        color: 'white',
    },
    closeIcon: {
        fontSize: 30,
        color: 'white',
    },
    count: {
        color: 'white',
        position: 'fixed',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
    infos: {
        color: 'white',
        position: 'fixed',
        bottom: theme.spacing(2),
        left: theme.spacing(2),
    },
});

const ImageGallery = ({
    closeLightbox,
    classes,
    imageList,
    currentIndex,
    setCurrentIndex,
    getExtraInfos,
}) => {
    const currentImg = imageList[currentIndex];
    if (!currentImg) return null;
    const currentImgSrc = currentImg.path;
    return (
        <>
            <Dialog
                classes={{
                    paper: classes.paper,
                }}
                open
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') {
                        closeLightbox();
                    }
                }}
                maxWidth="xl"
            >
                <DialogContent className={classes.content}>
                    {currentIndex > 0 && (
                        <IconButton
                            color="primary"
                            className={classes.prevButton}
                            onClick={() => setCurrentIndex(currentIndex - 1)}
                        >
                            <ArrowLeft className={classes.navIcon} />
                        </IconButton>
                    )}
                    {currentIndex + 1 < imageList.length && (
                        <IconButton
                            color="primary"
                            className={classes.nextButton}
                            onClick={() => setCurrentIndex(currentIndex + 1)}
                        >
                            <ArrowRight className={classes.navIcon} />
                        </IconButton>
                    )}
                    <IconButton
                        color="primary"
                        className={classes.closeButton}
                        onClick={() => closeLightbox()}
                    >
                        <Close className={classes.closeIcon} />
                    </IconButton>
                    {}
                    <div className={classes.infos}>
                        {getExtraInfos(currentImg)}
                    </div>
                    <Typography
                        color="primary"
                        type="h6"
                        className={classes.count}
                    >
                        {`${currentIndex + 1} / ${imageList.length}`}
                    </Typography>
                    <img className={classes.image} alt="" src={currentImgSrc} />
                </DialogContent>
            </Dialog>
        </>
    );
};

ImageGallery.defaultProps = {
    imageList: [],
    currentIndex: 0,
    getExtraInfos: () => null,
};

ImageGallery.propTypes = {
    classes: PropTypes.object.isRequired,
    closeLightbox: PropTypes.func.isRequired,
    setCurrentIndex: PropTypes.func.isRequired,
    imageList: PropTypes.array,
    currentIndex: PropTypes.number,
    getExtraInfos: PropTypes.func,
};

export default withStyles(styles)(ImageGallery);
