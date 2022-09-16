import { Button, withStyles } from '@material-ui/core';
import PublicIcon from '@material-ui/icons/Public';
import { ExcellSvg, CsvSvg } from 'bluesquare-components';
import PropTypes from 'prop-types';
import React from 'react';

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
        <div data-test="download-buttons">
            <Button
                data-test="csv-export-button"
                variant="contained"
                className={classes.button}
                color="primary"
                href={csvUrl}
            >
                <CsvSvg />
                CSV
            </Button>
            <Button
                data-test="xlsx-export-button"
                variant="contained"
                className={classes.button}
                color="primary"
                href={xlsxUrl}
            >
                <ExcellSvg className={classes.icon} />
                XLSX
            </Button>
            {gpkgUrl !== null && (
                <Button
                    data-test="gpkg-export-button"
                    variant="contained"
                    className={classes.button}
                    color="primary"
                    href={gpkgUrl}
                >
                    <PublicIcon className={classes.icon} />
                    GPKG
                </Button>
            )}
        </div>
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
