import React from 'react';
import PropTypes from 'prop-types';
import { Button, withStyles } from '@material-ui/core';
import SaveAlt from '@material-ui/icons/SaveAlt';
import { ExcellSvg } from 'bluesquare-components';
import PublicIcon from '@material-ui/icons/Public';

const styles = theme => ({
    button: {
        marginLeft: theme.spacing(2),
        '& svg, & i': {
            marginRight: theme.spacing(1),
        },
    },
    icon: {
        height: theme.spacing(3),
        width: 'auto',
        marginRight: theme.spacing(1),
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
                <ExcellSvg className={classes.icon} />
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
                    <PublicIcon className={classes.icon} />
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
