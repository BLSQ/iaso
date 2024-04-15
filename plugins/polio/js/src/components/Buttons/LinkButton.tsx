import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useStyles } from '../../styles/theme';

type Props = {
    url: string;
    icon: any;
};

export const LinkButton: FunctionComponent<Props> = ({
    icon: Icon,
    children,
    url,
}) => {
    const classes: Record<string, string> = useStyles();
    return (
        <Link download href={url}>
            <Button variant="contained" color="primary" component="div">
                <Icon className={classes.buttonIcon} />
                {children}
            </Button>
        </Link>
    );
};
