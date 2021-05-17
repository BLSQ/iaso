import React from 'react';
import PropTypes from 'prop-types';
import SvgIcon from '@material-ui/core/SvgIcon';
import { withStyles } from '@material-ui/core';

const styles = theme => ({
    text: {
        fontFamily: '"DINAlternate-Bold", "DIN Alternate", sans-serif',
        fontWeight: '700',
        fontSize: 122,
    },
    path: {
        fill: theme.palette.primary.main,
    },
    pathWithOpacity: {
        fill: theme.palette.primary.main,
        fillOpacity: 0.5,
    },
});

const LogoSvg = props => {
    const finalProps = {
        ...props,
        viewBox: '0 0 485 189',
    };
    delete finalProps.classes;
    const { classes } = props;
    return (
        <SvgIcon {...finalProps}>
            <g transform="matrix(1,0,0,1,-2590,-1245)">
                <g transform="matrix(1.16782,0,0,1.26061,3359.56,1421.94)">
                    <g transform="matrix(1,0,0,0.974359,-16.6837,21.6257)">
                        <g transform="matrix(0.734443,0,0,0.698287,-890.4,-332.602)">
                            <text
                                x="578px"
                                y="391.292px"
                                className={classes.text}
                            >
                                Iaso
                            </text>
                        </g>
                        <g transform="matrix(1,0,0,1,-87.2457,61.2064)">
                            <g transform="matrix(0.8563,0,0,0.814145,-2867.79,-420.77)">
                                <path
                                    // eslint-disable-next-line max-len
                                    d="M2869.46,278.33C2872.75,280.401 2874.81,283.885 2874.96,287.857L2874.96,375.357C2874.81,379.246 2872.82,382.769 2869.46,384.883L2799.18,425.457L2799,400.155L2852.96,369.006L2852.96,294.207L2799,263.058L2799,237.856C2824.26,252.44 2844.2,263.747 2869.46,278.33ZM2706.9,278.33C2703.61,280.401 2701.55,283.885 2701.4,287.857L2701.4,375.357C2701.55,379.246 2703.54,382.769 2706.9,384.883L2777.18,425.457L2777.35,400.155L2723.4,369.006L2723.4,294.207L2777.35,263.058L2777.35,237.856C2752.09,252.44 2732.16,263.747 2706.9,278.33Z"
                                    className={classes.path}
                                />
                            </g>
                            <g transform="matrix(0.8563,0,0,0.814145,-3875.01,-384.935)">
                                <path
                                    // eslint-disable-next-line max-len
                                    d="M4008.65,294.53C4010.05,294.732 4010.41,294.956 4011.07,295.387C4013.93,297.241 4014.32,302.019 4011.54,304.274C4011.24,304.516 4011.15,304.559 4010.83,304.763L3967.53,329.763C3965.81,330.672 3963.78,330.692 3962.03,329.763L3918.72,304.763C3917.53,304.011 3917.29,303.659 3916.86,302.996C3915.01,300.147 3916.55,295.625 3920.05,294.687C3921.44,294.315 3922.94,294.56 3924.22,295.237L3964.78,318.649L4005.33,295.237C4005.33,295.237 4007.17,294.433 4008.65,294.53Z"
                                    className={classes.pathWithOpacity}
                                />
                            </g>
                            <g transform="matrix(0.867996,0,0,0.759868,-3912.36,-403.129)">
                                <path
                                    // eslint-disable-next-line max-len
                                    d="M3955.64,286.253C3957.04,286.493 3956.67,286.423 3957.64,286.958L4000.64,312.997C4001.83,313.785 4002.07,314.159 4002.51,314.865C4004,317.29 4003.51,320.932 4001.35,322.777C4001.05,323.032 4000.97,323.076 4000.64,323.29L3957.64,349.329C3955.99,350.243 3954.04,350.256 3952.36,349.329L3909.36,323.29C3908.17,322.502 3907.93,322.128 3907.49,321.423C3905.99,318.991 3906.49,315.356 3908.65,313.51C3908.95,313.255 3909.03,313.211 3909.36,312.997L3952.36,286.958C3953.36,286.403 3954.47,286.153 3955.64,286.253ZM3923.14,318.144L3955,337.435L3986.86,318.144L3955,298.852C3944.38,305.282 3933.76,311.713 3923.14,318.144Z"
                                    className={classes.pathWithOpacity}
                                />
                            </g>
                        </g>
                    </g>
                </g>
            </g>
        </SvgIcon>
    );
};

LogoSvg.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LogoSvg);
