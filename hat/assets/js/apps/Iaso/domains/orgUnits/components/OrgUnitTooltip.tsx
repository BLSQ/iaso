import React, { createElement, FunctionComponent, ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import OrgUnitsSmallInfos from './OrgUnitsSmallInfos';
import { OrgUnit } from '../types/orgUnit';

const useStyles = makeStyles(() => ({
    root: {
        maxWidth: 'none',
        minWidth: 180,
    },
    container: {
        cursor: 'pointer',
    },
}));
type Props = {
    orgUnit: OrgUnit;
    children?: ReactNode | null;
    domComponent?: string;
    enterDelay?: number;
    enterNextDelay?: number;
};

const OrgUnitTooltip: FunctionComponent<Props> = ({
    orgUnit,
    children = null,
    domComponent = 'section',
    enterDelay = 500,
    enterNextDelay = 500,
}) => {
    const classes = useStyles();
    return (
        <Tooltip
            classes={{ tooltip: classes.root }}
            title={<OrgUnitsSmallInfos orgUnit={orgUnit} />}
            arrow
            enterDelay={enterDelay}
            enterNextDelay={enterNextDelay}
        >
            {createElement(
                domComponent,
                { className: classes.container },
                children,
            )}
        </Tooltip>
    );
};

export default OrgUnitTooltip;
