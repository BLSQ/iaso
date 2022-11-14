import React, { FunctionComponent } from 'react';
import { Typography } from '@material-ui/core';

type Props = {
    text: string;
    displayTrigger: unknown;
};
export const GraphTitle: FunctionComponent<Props> = ({
    text,
    displayTrigger,
}) => {
    return (
        <>
            {displayTrigger && (
                <Typography variant="h5" color="primary">
                    {text}
                </Typography>
            )}
        </>
    );
};
