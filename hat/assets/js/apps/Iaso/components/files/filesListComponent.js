import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import LazyImage from 'react-lazy-progressive-image';
import Carousel, { Modal, ModalGateway } from 'react-images';

import {
    Grid,
    withStyles,
} from '@material-ui/core';
import grey from '@material-ui/core/colors/grey';

import PropTypes from 'prop-types';

import LoadingSpinner from '../LoadingSpinnerComponent';

const getFileName = (path) => {
    const fullName = path.split('/').slice(-1)[0].split('.');
    return ({
        name: fullName[0],
        extension: fullName[1],
    });
};


const styles = () => ({
    modalContainer: {
        '& .fullscreen': {
            zIndex: 100,
        },
    },
    imageListContainer: {
        display: 'flex',
        width: '100%',
        flexWrap: 'wrap',
    },
    imageItem: {
        width: '100%',
        height: '200px',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: grey['100'],
        overflow: 'hidden',
    },
    image: {
        width: 'auto',
        height: '100%',
        margin: '0 auto',
        display: 'block',
        objectFit: 'contain',
        cursor: 'pointer',
    },
});

function FilesList(props) {
    const {
        files,
        classes,
    } = props;
    const [currentImage, setCurrentImage] = useState(0);
    const [viewerIsOpen, setViewerIsOpen] = useState(false);
    const openLightbox = useCallback((index) => {
        setCurrentImage(index);
        setViewerIsOpen(true);
    }, []);

    const closeLightbox = () => {
        setCurrentImage(0);
        setViewerIsOpen(false);
    };

    return (

        <Grid container spacing={2}>
            {
                files.map((file, index) => (

                    <Grid
                        item
                        xs={3}
                        key={`${file.itemId}-${getFileName(file.src).name}`}
                        className={classes.imageItem}
                    >
                        <LazyImage
                            src={file.src}
                            visibilitySensorProps={{
                                partialVisibility: true,
                            }}
                        >
                            {(src, loading, isVisible) => (
                                <div
                                    className={classes.imageContainer}
                                >
                                    {
                                        loading
                                            ? <LoadingSpinner fixed={false} transparent padding={4} size={25} />
                                            : (
                                                <img
                                                    onClick={() => openLightbox(index)}
                                                    className={classes.image}
                                                    alt=""
                                                    src={src}
                                                />
                                            )
                                    }

                                </div>
                            )}
                        </LazyImage>
                    </Grid>
                ))
            }
            <div className={classes.modalContainer}>
                <ModalGateway>
                    {viewerIsOpen ? (
                        <Modal onClose={closeLightbox}>
                            <Carousel
                                currentIndex={currentImage}
                                views={files.map(file => ({
                                    ...file,
                                    srcset: file.srcSet,
                                }))}
                            />
                        </Modal>
                    ) : null}
                </ModalGateway>
            </div>
        </Grid>
    );
}


FilesList.propTypes = {
    files: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default withStyles(styles)(connect(MapStateToProps, MapDispatchToProps)(FilesList));
