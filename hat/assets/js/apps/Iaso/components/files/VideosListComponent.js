import React, { Component, Fragment } from 'react';
import isEqual from 'lodash/isEqual';

import { Grid } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import { getFileName } from '../../utils/filesUtils';
import VideoItem from './VideoItemComponent';

const styles = theme => ({
    root: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
});

class VideosListComponent extends Component {
    shouldComponentUpdate(nextProps) {
        return !isEqual(nextProps.videoList, this.props.videoList);
    }

    render() {
        const { videoList, classes } = this.props;
        return (
            <>
                <Grid container spacing={2} className={classes.root}>
                    {videoList.map(file => (
                        <Grid
                            item
                            md={6}
                            key={`${file.itemId}-${
                                getFileName(file.path).name
                            }`}
                        >
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
