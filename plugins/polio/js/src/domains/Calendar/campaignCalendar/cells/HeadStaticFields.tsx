import React, { FunctionComponent, useCallback } from 'react';

import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';

import {
    getOrderArray,
    getSort,
    useKeyPressListener,
    useSafeIntl,
} from 'bluesquare-components';

import { Box, TableCell, TableSortLabel } from '@mui/material';
import { replace } from 'react-router-redux';
import { genUrl } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { User } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

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

export const HeadStaticFieldsCells: FunctionComponent<Props> = ({
    orders,
    router,
    isPdf,
}) => {
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
    const isLogged = useSelector((state: { users: { current: User } }) =>
        Boolean(state.users.current),
    );
    const getWidth = useCallback(
        (f: Field) => {
            if (f.key === 'edit') {
                return '30px';
            }
            return !isLogged || isPdf ? '85px' : '75px';
        },
        [isLogged, isPdf],
    );
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
                        sx={{
                            top: 100,
                            width: getWidth(f),
                            minWidth: getWidth(f),
                        }}
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
