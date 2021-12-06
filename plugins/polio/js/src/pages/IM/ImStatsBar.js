import React from 'react';
import { Grid } from '@material-ui/core';
import { number, string } from 'prop-types';
import { textPlaceholder } from 'bluesquare-components';

const percentRatio = (data, total) => {
    if (data && total) {
        return (100 * (data / total)).toFixed(2);
    }
    return 0;
};

export const ImStatsBar = ({ data, total, message, color }) => {
    const ratio = percentRatio(data, total);
    return (
        <Grid container item direction="row">
            <Grid item xs={12}>
                <div
                    style={{
                        height: '100%',
                        alignItems: 'center',
                        display: 'flex',
                        marginBottom: '10px',
                    }}
                >
                    <div
                        style={{
                            minHeight: '20px',
                            backgroundColor: color,
                            opacity: 0.7,
                            minWidth: '1px',
                            height: '70%',
                            width: `calc((100% - 100px) * (${ratio} /100))`,
                            marginRight: '15px',
                        }}
                    />
                    <div style={{ width: '100px' }}>{`${data} ${message}`}</div>
                </div>
            </Grid>
            {/* <Grid container item xs={3} alignItems="center">
                <Grid item>
                    <span>{`${data} ${message}`}</span>
                </Grid>
            </Grid> */}
        </Grid>
    );
};

ImStatsBar.propTypes = {
    data: number,
    total: number,
    message: string,
    color: string.isRequired,
};

ImStatsBar.defaultProps = {
    data: 0,
    total: 0,
    message: textPlaceholder,
};
