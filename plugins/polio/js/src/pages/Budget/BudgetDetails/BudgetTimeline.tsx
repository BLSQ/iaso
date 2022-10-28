import { makeStyles } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import WidgetPaperComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../../constants/messages';
import { Categories } from '../types';

type Props = {
    categories?: Categories;
};

export const BudgetTimeline: FunctionComponent<Props> = ({
    categories = [],
}) => {
    return (
        <>
            {categories?.map(category => (
                <h1>{category.key}</h1>
            ))}
            ;
        </>
    );
};
