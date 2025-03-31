import React, { FunctionComponent, useCallback } from 'react';

import { Box, TableCell, TableSortLabel } from '@mui/material';
import {
    getOrderArray,
    getSort,
    useKeyPressListener,
    useSafeIntl,
    useRedirectToReplace,
} from 'bluesquare-components';
import classnames from 'classnames';

import MESSAGES from '../../../../constants/messages';
import { useStaticFields } from '../../hooks/useStaticFields';
import { Field } from '../../types';
import { colSpanTitle } from '../constants';
import { useStyles } from '../Styles';

type Props = {
    orders: string;
    isPdf: boolean;
    url: string;
    isLogged: boolean;
};

type Order = {
    id: string;
    desc: boolean;
};

export const HeadStaticFieldsCells: FunctionComponent<Props> = ({
    orders,
    url,
    isPdf,
    isLogged,
}) => {
    const classes: Record<string, any> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
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

        redirectToReplace(url, {
            order: getSort(newSort),
        });
    };
    const fields = useStaticFields(isPdf);
    const defaultWidth = !isLogged || isPdf ? '85px' : '70px';

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
                            width: f.width || defaultWidth,
                            minWidth: f.width || defaultWidth,
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
