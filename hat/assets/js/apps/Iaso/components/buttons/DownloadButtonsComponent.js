import React, { Fragment } from 'react';

import PropTypes from 'prop-types';

import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core';
import SaveAlt from '@material-ui/icons/SaveAlt';

const styles = theme => ({
    button: {
        marginLeft: theme.spacing(2),
        '& svg, & i': {
            marginRight: theme.spacing(1),
        },
    },
});

function DownloadButtonsComponent(props) {
    const {
        csvUrl,
        xlsxUrl,
        classes,
    } = props;

    return (
        <Fragment>
            <Button
                variant="contained"
                className={classes.button}
                color="primary"
                onClick={() => {
                    window.location.href = csvUrl;
                }}
            >
                <SaveAlt />
                CSV
            </Button>
            <Button
                variant="contained"
                className={classes.button}
                color="primary"
                onClick={() => {
                    window.location.href = xlsxUrl;
                }}
            >
                <i className="fa fa-file-excel-o" />
                XLSX
            </Button>
        </Fragment>
    );
}

DownloadButtonsComponent.defaultProps = {
    csvUrl: '',
    xlsxUrl: '',
};

DownloadButtonsComponent.propTypes = {
    csvUrl: PropTypes.string,
    xlsxUrl: PropTypes.string,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DownloadButtonsComponent);
