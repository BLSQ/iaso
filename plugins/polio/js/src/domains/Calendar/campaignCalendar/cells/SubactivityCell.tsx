import React, {
    FunctionComponent,
    useCallback,
    useContext,
    useState,
} from 'react';

import { Box, TableCell } from '@mui/material';
import classnames from 'classnames';

import { isEqual } from 'lodash';
import { SUBACTIVITY_CELL_COLOR } from '../constants';
import { RoundPopperContext } from '../contexts/RoundPopperContext';
import { SubactivityPopper } from '../popper/SubactivityPopper';
import { smallCellHeight, useStyles } from '../Styles';
import { SubActivity, MappedCampaign } from '../types';

type Props = {
    colSpan: number;
    campaign: MappedCampaign;
    subactivity: SubActivity;
};

export const SubactivityCell: FunctionComponent<Props> = ({
    colSpan,
    campaign,
    subactivity,
}) => {
    const classes = useStyles();
    const { anchorEl, setAnchorEl } = useContext(RoundPopperContext);
    const [self, setSelf] = useState<HTMLElement | null>(null);
    const open = anchorEl && isEqual(self, anchorEl);

    const defaultCellStyles = [classes.tableCell, classes.tableCellBordered];
    const handleClick = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (!self) {
                setSelf(event.currentTarget);
            }
            setAnchorEl(
                isEqual(event.currentTarget, anchorEl)
                    ? undefined
                    : event.currentTarget,
            );
        },
        [anchorEl, self, setAnchorEl],
    );
    const handleClose = () => {
        setAnchorEl(undefined);
    };
    return (
        <TableCell
            className={classnames(defaultCellStyles, classes.round)}
            colSpan={colSpan}
        >
            <Box
                className={classes.coloredBox}
                sx={{
                    background: SUBACTIVITY_CELL_COLOR,
                }}
            />
            <span
                onClick={handleClick}
                role="button"
                tabIndex={0}
                className={classnames(
                    classes.tableCellSpan,
                    classes.tableCellSpanWithPopOver,
                )}
                style={{
                    color: 'white',
                }}
            />
            {open && (
                <SubactivityPopper
                    open={open}
                    subactivity={subactivity}
                    anchorEl={anchorEl}
                    campaign={campaign}
                    handleClose={handleClose}
                />
            )}
        </TableCell>
    );
};
