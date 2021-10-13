import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import { useKeyPressListener, useSafeIntl } from 'bluesquare-components';

import { TableCell, TableSortLabel } from '@material-ui/core';

import { replace } from 'react-router-redux';
import { withRouter } from 'react-router';
import { colSpanTitle, staticFields } from '../constants';
import { getOrderArray, getSort } from '../utils';
import { useStyles } from '../Styles';
import MESSAGES from '../../../constants/messages';
import { genUrl } from '../../../utils/routing';

const HeadStaticFieldsCells = ({ orders, router }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const shiftKeyIsDown = useKeyPressListener('Shift');
    const ordersArray = getOrderArray(orders);
    const handleSort = (field, existingSort) => {
        let desc = true;
        if (existingSort && existingSort.desc) {
            desc = false;
        }
        const currentSort = {
            desc,
            id: field.sortKey,
        };
        let newSort = [];
        if (shiftKeyIsDown) {
            newSort = [
                ...ordersArray.filter(
                    o => o.id !== field.sortKey && shiftKeyIsDown,
                ),
            ];
        }
        newSort.push(currentSort);

        const url = genUrl(router, {
            order: getSort(newSort),
        });

        dispatch(replace(url));
    };
    return staticFields.map(f => {
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
                className={classnames(
                    classes.tableCellTitle,
                    classes.tableCellTitleLarge,
                )}
                colSpan={colSpanTitle}
                style={{ top: 100 }}
            >
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
                        classes={{
                            root: classes.sortLabel,
                            icon: classes.icon,
                        }}
                    >
                        {formatMessage(MESSAGES[f.key])}
                    </TableSortLabel>
                </span>
            </TableCell>
        );
    });
};

HeadStaticFieldsCells.propTypes = {
    orders: PropTypes.string.isRequired,
};

const wrappedHeadStaticFieldsCells = withRouter(HeadStaticFieldsCells);
export { wrappedHeadStaticFieldsCells as HeadStaticFieldsCells };
