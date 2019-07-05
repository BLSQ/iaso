import React from 'react';

import PropTypes from 'prop-types';

import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core';
import SaveAlt from '@material-ui/icons/SaveAlt';

const styles = theme => ({
    container: {
        textAlign: 'right',
        marginBottom: theme.spacing(4),
        marginTop: theme.spacing(2),
    },
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
        <Container maxWidth={false} className={classes.container}>
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
        </Container>
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
