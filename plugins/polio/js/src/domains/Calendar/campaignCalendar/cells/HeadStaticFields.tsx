import React, { FunctionComponent } from 'react';

import classnames from 'classnames';
import { useDispatch } from 'react-redux';

import {
    getOrderArray,
    getSort,
    useKeyPressListener,
    useSafeIntl,
} from 'bluesquare-components';

import { Box, TableCell, TableSortLabel } from '@mui/material';

import { replace } from 'react-router-redux';
import { genUrl } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import {
    Router,
    SxStyles,
} from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import { useStaticFields } from '../../hooks/useStaticFields';
import { Field } from '../../types';
import { useStyles } from '../Styles';
import { colSpanTitle } from '../constants';

type Props = {
    orders: string;
    router: Router;
    isPdf: boolean;
};

type Order = {
    id: string;
    desc: boolean;
};

const cellStyle = (key: string): SxStyles => ({
    quarter: {
        top: 100,
        minWidth: '25px',
    },
    semester: {
        top: 100,
        minWidth: '50px',
    },
    year: {
        top: 100,
        minWidth: key === 'edit' ? '50px' : '90px',
    },
});

export const HeadStaticFieldsCells: FunctionComponent<Props> = ({
    orders,
    router,
    isPdf,
}) => {
    const periodType = router.params.periodType || 'quarter';
    const classes: Record<string, any> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const shiftKeyIsDown = useKeyPressListener('Shift');
    const ordersArray = getOrderArray(orders);
    const handleSort = (field: Field, existingSort: Order) => {
        let desc = true;
        if (existingSort && existingSort.desc) {
            desc = false;
        }
        const currentSort = field.sortKey && {
            desc,
            id: field.sortKey,
        };
        let newSort: Order[] = [];
        if (shiftKeyIsDown) {
            newSort = [
                ...ordersArray.filter(
                    o => o.id !== field.sortKey && shiftKeyIsDown,
                ),
            ];
        }
        if (currentSort) {
            newSort.push(currentSort);
        }

        const url = genUrl(router, {
            order: getSort(newSort),
        });

        dispatch(replace(url));
    };
    const fields = useStaticFields(isPdf);
    return (
        <>
            {fields.map(f => {
                const sort = ordersArray.find(o => o.id === f.sortKey);
                const sortActive = Boolean(sort);
                const direction = sortActive && !sort.desc ? 'asc' : 'desc';
                let title = MESSAGES.sortDesc;
                if (sortActive) {
                    if (sort?.desc) {
                        title = MESSAGES.sortAsc;
                    }
                }
                return (
                    <TableCell
                        key={f.key}
                        className={classnames(classes.tableCellTitle)}
                        colSpan={colSpanTitle}
                        sx={cellStyle(f.key)[periodType]}
                    >
                        <Box position="relative" width="100%" height="100%">
                            {f.sortKey && (
                                <span
                                    onClick={() => handleSort(f, sort)}
                                    role="button"
                                    tabIndex={0}
                                    className={classnames(
                                        classes.tableCellSpan,
                                        classes.tableCellSpanTitle,
                                    )}
                                >
                                    <TableSortLabel
                                        active={sortActive}
                                        direction={direction}
                                        title={formatMessage(title)}
                                    >
                                        {formatMessage(MESSAGES[f.key])}
                                    </TableSortLabel>
                                </span>
                            )}
                            {!f.sortKey && !f.hideHeadTitle && (
                                <span
                                    className={classnames(
                                        classes.tableCellSpan,
                                        classes.tableCellSpanTitle,
                                    )}
                                >
                                    {formatMessage(MESSAGES[f.key])}
                                </span>
                            )}
                        </Box>
                    </TableCell>
                );
            })}
        </>
    );
};
