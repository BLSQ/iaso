import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { ExternalLink } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

type Props = {
    destinationName: string;
    url: string;
};

const useStyles = makeStyles({
    link: {
        ' & > a': {
            color: '#33FF00',
            '&:hover': {
                textDecoration: 'none',
                fontWeight: 'bolder',
            },
        },
    },
});

const pipe = ` 
________________
|              |
|              |
|              |
———          ———
|         |
|         |
|         |
|         |
|         |
|         |
|         |
|         |
———————————————————
`;

export const ProductivityOption: FunctionComponent<Props> = ({
    destinationName,
    url,
}) => {
    const classes = useStyles();
    return (
        <Box className={classes.link}>
            <ExternalLink url={url}>
                <span>{destinationName.toUpperCase()}</span>
            </ExternalLink>
            <Box mt={4}>
                <pre>{pipe}</pre>
            </Box>
        </Box>
    );
};
