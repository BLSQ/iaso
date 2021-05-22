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
    const { csvUrl, xlsxUrl, gpkgUrl, classes } = props;

    return (
        <>
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
            {gpkgUrl !== null && (
                <Button
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    onClick={() => {
                        window.location.href = gpkgUrl;
                    }}
                >
                    <i className="fa fa-globe" />
                    GPKG
                </Button>
            )}
        </>
    );
}

DownloadButtonsComponent.defaultProps = {
    csvUrl: '',
    xlsxUrl: '',
    gpkgUrl: null,
};

DownloadButtonsComponent.propTypes = {
    csvUrl: PropTypes.string,
    xlsxUrl: PropTypes.string,
    gpkgUrl: PropTypes.string,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DownloadButtonsComponent);
