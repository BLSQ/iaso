import React, { Component, Fragment } from 'react';
import isEqual from 'lodash/isEqual';

import { Grid } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import { getFileName } from '../../utils/filesUtils';
import DocumentsItem from './DocumentsItemComponent';

const styles = theme => ({
    root: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
});

class DocumentsListComponent extends Component {
    shouldComponentUpdate(nextProps) {
        return !isEqual(nextProps.docsList, this.props.docsList);
    }

    render() {
        const { docsList, classes } = this.props;
        return (
            <>
                <Grid container spacing={2} className={classes.root}>
                    {docsList.map(file => (
                        <Grid
                            item
                            sm={2}
                            md={1}
                            key={`${file.itemId}-${
                                getFileName(file.path).name
                            }`}
                        >
                            <DocumentsItem file={file} />
                        </Grid>
                    ))}
                </Grid>
            </>
        );
    }
}

DocumentsListComponent.propTypes = {
    docsList: PropTypes.array.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DocumentsListComponent);
