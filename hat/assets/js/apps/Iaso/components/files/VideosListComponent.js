import React, { Component, Fragment } from 'react';
import isEqual from 'lodash/isEqual';

import { Grid, Checkbox } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import { getFileName } from '../../utils/filesUtils';
import VideoItem from './VideoItemComponent';

const styles = theme => ({
    root: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
    fileCheckBox: {
        left: theme.spacing(105),
    }
});

class VideosListComponent extends Component {
    shouldComponentUpdate(nextProps) {
        return !isEqual(nextProps.videoList, this.props.videoList);
    }
    selectedVideos(event, index) {
        let checked = event.target.checked;
        this.props.onSelectedFiles(index, checked);
    }

    render() {
        const { videoList, classes } = this.props;
        return (
            <>
                <Grid container spacing={2} className={classes.root}>
                    {videoList.map((file,index) => (
                        <Grid
                            item
                            md={6}
                            key={`${file.itemId}-${
                                getFileName(file.path).name
                            }`}
                        >
                             <Checkbox className={classes.fileCheckBox} onChange={event => this.selectedVideos(event, index)}/>
                            <VideoItem videoItem={file} />
                        </Grid>
                    ))}
                </Grid>
            </>
        );
    }
}

VideosListComponent.propTypes = {
    videoList: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(VideosListComponent);
