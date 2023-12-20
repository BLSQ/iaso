import React, { Component } from 'react';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';

import { Grid, Tabs, Tab } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import { injectIntl } from 'bluesquare-components';
import ErrorPaperComponent from '../../../components/papers/ErrorPaperComponent';
import ImageGallery from '../../../components/dialogs/ImageGalleryComponent';
import LazyImagesList from '../../../components/files/LazyImagesListComponent';
import DocumentsList from '../../../components/files/DocumentsListComponent';
import VideosList from '../../../components/files/VideosListComponent';
import InstancePopover from './InstancePopoverComponent.tsx';

import { sortFilesType } from '../../../utils/filesUtils';
import { fetchInstanceDetail } from '../../../utils/requests';
import MESSAGES from '../messages';

const minTabHeight = 'calc(100vh - 500px)';

const styles = theme => ({
    root: {
        position: 'relative',
    },
    images: {
        height: 'auto',
        width: '100%',
        marginTop: theme.spacing(2),
    },
    hiddenImages: {
        width: '100%',
        height: minTabHeight,
        overflow: 'hidden',
        position: 'absolute',
        zIndex: '-1',
        marginTop: theme.spacing(2),
    },
    tabContainer: {
        minHeight: minTabHeight,
        backgroundColor: 'white',
        marginTop: theme.spacing(2),
    },
});

class InstancesFilesList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentImageIndex: 0,
            viewerIsOpen: false,
            sortedFiles: sortFilesType(props.files ? props.files : []),
            instanceDetail: props.instanceDetail,
            tab: 'images',
        };
    }

    componentDidUpdate(prevProps) {
        const { files } = this.props;
        if (files && !isEqual(prevProps.files, files)) {
            this.setFiles(files);
        }
    }

    handleChangeTab(tab) {
        this.setState({
            tab,
        });
    }

    setFiles(files) {
        this.setState({
            sortedFiles: files ? sortFilesType(files) : [],
        });
    }

    setCurrentIndex(fileIndex, fileTypeKey) {
        const { dispatch, fetchDetails } = this.props;
        const { sortedFiles } = this.state;
        if (fileIndex >= 0) {
            const file = sortedFiles[fileTypeKey][fileIndex];
            if (fetchDetails) {
                this.setState({
                    instanceDetail: null,
                });
                if (file) {
                    fetchInstanceDetail(dispatch, file.itemId).then(
                        instanceDetail => {
                            this.setState({
                                instanceDetail,
                            });
                        },
                    );
                }
            }
        }
        this.setState({
            currentImageIndex: fileIndex,
        });
    }

    openLightbox(index) {
        const { onLightBoxToggled } = this.props;
        this.setCurrentIndex(index, 'images');
        this.setState({
            viewerIsOpen: true,
        });
        onLightBoxToggled(true);
    }

    closeLightbox() {
        const { fetchDetails, instanceDetail, onLightBoxToggled } = this.props;
        this.setCurrentIndex(-1, 'images');
        this.setState({
            viewerIsOpen: false,
            instanceDetail: fetchDetails ? null : instanceDetail,
        });
        onLightBoxToggled(false);
    }

    render() {
        const {
            fetching,
            files,
            classes,
            intl: { formatMessage },
        } = this.props;

        const {
            currentImageIndex,
            viewerIsOpen,
            sortedFiles,
            instanceDetail,
            tab,
        } = this.state;
        if (fetching || !files) return null;
        if (files.length === 0) {
            return (
                <Grid container spacing={0}>
                    <Grid item xs={5} />
                    <Grid item xs={2}>
                        <ErrorPaperComponent
                            message={formatMessage(MESSAGES.missingFile)}
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
                    onChange={(event, newtab) => this.handleChangeTab(newtab)}
                >
                    {Object.keys(sortedFiles).map(fileKey => {
                        const filesByType = sortedFiles[fileKey];
                        let filesCount = 0;
                        if (Array.isArray(filesByType)) {
                            filesCount = filesByType.length;
                        } else {
                            Object.keys(filesByType).forEach(fileSubKey => {
                                filesCount += filesByType[fileSubKey].length;
                            });
                        }
                        return (
                            <Tab
                                disabled={filesCount === 0}
                                key={fileKey}
                                value={fileKey}
                                label={`${formatMessage(
                                    MESSAGES[fileKey],
                                )} (${filesCount})`}
                            />
                        );
                    })}
                </Tabs>
                <div
                    className={
                        tab !== 'images' ? classes.hiddenImages : classes.images
                    }
                >
                    <LazyImagesList
                        imageList={sortedFiles.images}
                        onImageClick={index => this.openLightbox(index)}
                    />
                </div>
                {tab === 'videos' && (
                    <div className={classes.tabContainer}>
                        <VideosList videoList={sortedFiles.videos} />
                    </div>
                )}
                {tab === 'documents' && (
                    <div className={classes.tabContainer}>
                        <DocumentsList docsList={sortedFiles.documents} />
                    </div>
                )}
                {tab === 'others' && (
                    <div className={classes.tabContainer}>
                        <DocumentsList docsList={sortedFiles.others} />
                    </div>
                )}
                {viewerIsOpen && (
                    <ImageGallery
                        imageList={sortedFiles.images}
                        closeLightbox={() => this.closeLightbox()}
                        currentIndex={currentImageIndex}
                        setCurrentIndex={newIndex =>
                            this.setCurrentIndex(newIndex, 'images')
                        }
                        getExtraInfos={() => (
                            <InstancePopover instanceDetail={instanceDetail} />
                        )}
                    />
                )}
            </section>
        );
    }
}

InstancesFilesList.defaultProps = {
    fetchDetails: true,
    fetching: false,
    instanceDetail: null,
    files: [],
    onLightBoxToggled: () => null,
};

InstancesFilesList.propTypes = {
    files: PropTypes.any,
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    fetching: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    fetchDetails: PropTypes.bool,
    instanceDetail: PropTypes.object,
    onLightBoxToggled: PropTypes.func,
};

const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default withStyles(styles)(
    connect(
        MapStateToProps,
        MapDispatchToProps,
    )(injectIntl(InstancesFilesList)),
);
