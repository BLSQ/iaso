import React, { Component } from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';
import { injectIntl, intlShape } from 'react-intl';

import {
    Grid,
    withStyles,
    Tabs,
    Tab,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import ErrorPaperComponent from '../papers/ErrorPaperComponent';
import ImageGallery from '../dialogs/ImageGalleryComponent';
import LazyImagesList from './LazyImagesListComponent';
import DocumentsList from './DocumentsListComponent';
import VideosList from './VideosListComponent';
import InstancePopover from '../popover/InstancePopoverComponent';

import { sortFilesType } from '../../utils/filesUtils';
import { fetchInstanceDetail } from '../../utils/requests';

const minTabHeight = 'calc(100vh - 500px)';

const MESSAGES = {
    images: {
        defaultMessage: 'Images',
        id: 'iaso.label.images',
    },
    videos: {
        defaultMessage: 'Videos',
        id: 'iaso.label.videos',
    },
    documents: {
        defaultMessage: 'Documents',
        id: 'iaso.label.documents',
    },
    others: {
        defaultMessage: 'Others',
        id: 'iaso.label.others',
    },
};

const styles = () => ({
    root: {
        position: 'relative',
    },
    images: {
        height: 'auto',
        width: '100%',
    },
    hiddenImages: {
        width: '100%',
        height: minTabHeight,
        overflow: 'hidden',
        position: 'absolute',
        zIndex: '-1',
    },
    tabContainer: {
        minHeight: minTabHeight,
        backgroundColor: 'white',
    },
});

class InstancesFilesList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentImageIndex: 0,
            viewerIsOpen: false,
            sortedFiles: sortFilesType(props.files),
            instanceDetail: null,
            tab: 'images',
        };
    }

    componentDidUpdate(prevProps) {
        const {
            files,
        } = this.props;
        if (!isEqual(prevProps.files, files)) {
            this.setFiles(files);
        }
    }

    setFiles(files) {
        this.setState({
            sortedFiles: sortFilesType(files),
        });
    }

    setCurrentIndex(fileIndex, fileTypeKey) {
        const {
            dispatch,
        } = this.props;
        const {
            sortedFiles,
        } = this.state;
        if (fileIndex >= 0) {
            const file = sortedFiles[fileTypeKey][fileIndex];
            this.setState({
                instanceDetail: null,
            });
            if (file) {
                fetchInstanceDetail(dispatch, file.itemId).then((instanceDetail) => {
                    this.setState({
                        instanceDetail,
                    });
                });
            }
        }
        this.setState({
            currentImageIndex: fileIndex,
        });
    }

    openLightbox(index) {
        this.setCurrentIndex(index, 'images');
        this.setState({
            viewerIsOpen: true,
        });
    }

    closeLightbox() {
        this.setCurrentIndex(-1, 'images');
        this.setState({
            viewerIsOpen: false,
            instanceDetail: null,
        });
    }

    handleChangeTab(tab) {
        this.setState({
            tab,
        });
    }

    render() {
        const {
            fetching,
            files,
            classes,
            intl: {
                formatMessage,
            },
        } = this.props;

        const {
            currentImageIndex,
            viewerIsOpen,
            sortedFiles,
            instanceDetail,
            tab,
        } = this.state;
        if (fetching) return null;
        if (files.length === 0) {
            return (
                <Grid container spacing={0}>
                    <Grid item xs={5} />
                    <Grid item xs={2}>
                        <ErrorPaperComponent message={formatMessage({
                            defaultMessage: 'Cannot find an instance with a file',
                            id: 'iaso.instance.missingFile',
                        })}
                        />
                    </Grid>
                    <Grid item xs={5} />
                </Grid>
            );
        }
        return (
            <section className={classes.root}>
                <Tabs
                    indicatorColor="primary"
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    onChange={(event, newtab) => this.handleChangeTab(newtab)
                    }
                >
                    {
                        Object.keys(sortedFiles).map((fileKey) => {
                            const filesByType = sortedFiles[fileKey];
                            let filesCount = 0;
                            if (Array.isArray(filesByType)) {
                                filesCount = filesByType.length;
                            } else {
                                Object.keys(filesByType).forEach((fileSubKey) => {
                                    filesCount += filesByType[fileSubKey].length;
                                });
                            }
                            return (
                                <Tab
                                    disabled={filesCount === 0}
                                    key={fileKey}
                                    value={fileKey}
                                    label={`${formatMessage(MESSAGES[fileKey])} (${filesCount})`}
                                />
                            );
                        })
                    }
                </Tabs>
                <div className={tab !== 'images' ? classes.hiddenImages : classes.images}>
                    <LazyImagesList
                        imageList={sortedFiles.images}
                        onImageClick={index => this.openLightbox(index)}
                    />
                </div>
                {
                    tab === 'videos'
                    && (
                        <div className={classes.tabContainer}>
                            <VideosList videoList={sortedFiles.videos} />
                        </div>
                    )
                }
                {
                    tab === 'documents'
                    && (
                        <div className={classes.tabContainer}>
                            <DocumentsList docsList={sortedFiles.documents} />
                        </div>
                    )
                }
                {
                    tab === 'others'
                    && (
                        <div className={classes.tabContainer}>
                            <DocumentsList docsList={sortedFiles.others} />
                        </div>
                    )
                }
                {
                    viewerIsOpen
                    && (
                        <ImageGallery
                            imageList={sortedFiles.images}
                            closeLightbox={() => this.closeLightbox()}
                            currentIndex={currentImageIndex}
                            setCurrentIndex={newIndex => this.setCurrentIndex(newIndex, 'images')}
                            getExtraInfos={() => <InstancePopover instanceDetail={instanceDetail} />}
                        />
                    )
                }
            </section>
        );
    }
}


InstancesFilesList.propTypes = {
    files: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
    intl: intlShape.isRequired,
    fetching: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.instances.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default withStyles(styles)(connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstancesFilesList)));
