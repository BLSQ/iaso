import React, { FunctionComponent } from 'react';
import PublicIcon from '@mui/icons-material/Public';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { ExcellSvg, CsvSvg } from 'bluesquare-components';

export const useDownloadButtonStyles = makeStyles(theme => ({
    button: {
        marginLeft: `${theme.spacing(2)} !important`,
        '& svg, & i': {
            marginRight: theme.spacing(1),
        },
    },
    icon: {
        height: theme.spacing(3),
        width: 'auto',
        marginRight: theme.spacing(1),
    },
}));

type Props = {
    csvUrl?: string;
    xlsxUrl?: string;
    gpkgUrl?: string;
    disabled?: boolean;
    variant?: 'contained' | 'outlined';
};

const DownloadButtonsComponent: FunctionComponent<Props> = ({
    csvUrl,
    xlsxUrl,
    gpkgUrl,
    disabled = false,
    variant = 'outlined',
}) => {
    const classes = useDownloadButtonStyles();
    return (
        <div data-test="download-buttons">
            {csvUrl && typeof csvUrl === 'string' && (
                <Button
                    data-test="csv-export-button"
                    variant={variant}
                    className={classes.button}
                    color="primary"
                    href={csvUrl}
                    disabled={disabled}
                >
                    <CsvSvg />
                    CSV
                </Button>
            )}
            {xlsxUrl && typeof xlsxUrl === 'string' && (
                <Button
                    data-test="xlsx-export-button"
                    variant={variant}
                    className={classes.button}
                    color="primary"
                    href={xlsxUrl}
                    disabled={disabled}
                >
                    <ExcellSvg className={classes.icon} />
                    XLSX
                </Button>
            )}
            {gpkgUrl && typeof gpkgUrl === 'string' && (
                <Button
                    data-test="gpkg-export-button"
                    variant={variant}
                    className={classes.button}
                    color="primary"
                    href={gpkgUrl}
                    disabled={disabled}
                >
                    <PublicIcon className={classes.icon} />
                    GPKG
                </Button>
            )}
        </div>
    );
};

export default DownloadButtonsComponent;
