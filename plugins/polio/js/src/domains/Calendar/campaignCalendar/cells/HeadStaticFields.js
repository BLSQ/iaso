import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

import {
    useKeyPressListener,
    useSafeIntl,
    getOrderArray,
    getSort,
} from 'bluesquare-components';

import { TableCell, TableSortLabel } from '@material-ui/core';

import { replace } from 'react-router-redux';
import { withRouter } from 'react-router';
import { colSpanTitle, defaultStaticColWidth } from '../constants';
import { useStyles } from '../Styles';
import MESSAGES from '../../../../constants/messages';
import { genUrl } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import { useStaticFields } from '../../hooks/useStaticFields';

const HeadStaticFieldsCells = ({ orders, router, isPdf }) => {
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
    const fields = useStaticFields(isPdf);
    return fields.map(f => {
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
                style={{
                    top: 100,
                    width: f.width || defaultStaticColWidth,
                    minWidth: f.width || defaultStaticColWidth,
                }}
            >
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
                            classes={{
                                root: classes.sortLabel,
                                icon: classes.icon,
                            }}
                        >
                            {formatMessage(MESSAGES[f.key])}
                        </TableSortLabel>
                    </span>
                )}
                {!f.sortKey &&
                    !f.hideHeadTitle &&
                    formatMessage(MESSAGES[f.key])}
            </TableCell>
        );
    });
};

HeadStaticFieldsCells.propTypes = {
    orders: PropTypes.string.isRequired,
    isPdf: PropTypes.bool.isRequired,
};

const wrappedHeadStaticFieldsCells = withRouter(HeadStaticFieldsCells);
export { wrappedHeadStaticFieldsCells as HeadStaticFieldsCells };
