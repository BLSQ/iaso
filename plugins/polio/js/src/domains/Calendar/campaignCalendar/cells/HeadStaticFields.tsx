import React, { FunctionComponent, useCallback } from 'react';

import classnames from 'classnames';

import {
    getOrderArray,
    getSort,
    useKeyPressListener,
    useSafeIntl,
} from 'bluesquare-components';

import { Box, TableCell, TableSortLabel } from '@mui/material';
import { useRedirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { useStaticFields } from '../../hooks/useStaticFields';
import { Field } from '../../types';
import { useStyles } from '../Styles';
import { colSpanTitle } from '../constants';
import MESSAGES from '../../../../constants/messages';

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

    const getWidth = useCallback(
        (f: Field) => {
            if (f.key === 'edit') {
                return '30px';
            }
            return !isLogged || isPdf ? '85px' : '70px';
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
