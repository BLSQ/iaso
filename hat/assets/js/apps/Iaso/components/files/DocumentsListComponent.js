import React, { Component, Fragment } from 'react';
import isEqual from 'lodash/isEqual';

import { Grid, Checkbox } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import { getFileName } from '../../utils/filesUtils';
import DocumentsItem from './DocumentsItemComponent';

const styles = theme => ({
    root: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
    fileCheckBox: {
        left: theme.spacing(15),
    }
});

class DocumentsListComponent extends Component {
    shouldComponentUpdate(nextProps) {
        return !isEqual(nextProps.docsList, this.props.docsList);
    }
    selectedDocuments(event, index) {
        let checked = event.target.checked;
        this.props.onSelectedFiles(index, checked);
    }

    render() {
        const { docsList, classes } = this.props;
        return (
            <>
                <Grid container spacing={2} className={classes.root}>
                    {docsList.map((file,index) => (
                        <Grid
                            item
                            sm={2}
                            md={1}
                            key={`${file.itemId}-${
                                getFileName(file.path).name
                            }`}
                        >
                            <Checkbox className={classes.fileCheckBox} onChange={event => this.selectedDocuments(event, index)}/>
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
