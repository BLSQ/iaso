import React, { Fragment } from 'react';

import {
    Grid,
} from '@material-ui/core';

import PropTypes from 'prop-types';

const ModalItem = ({
    labelComponent,
    alignItems,
    fieldComponent,
}) => (
    <Fragment>
        <Grid
            xs={5}
            item
            container
            justify="flex-end"
            className="margin-bottom small-padding-right"
            alignItems={alignItems}
        >
            {labelComponent}
            :
        </Grid>
        <Grid
            xs={7}
            item
            container
            className="margin-bottom"
            justify="flex-start"
            alignItems={alignItems}
        >
            {fieldComponent}
        </Grid>
    </Fragment>
);

ModalItem.defaultProps = {
    alignItems: 'center',
};

ModalItem.propTypes = {
    alignItems: PropTypes.string,
    labelComponent: PropTypes.object.isRequired,
    fieldComponent: PropTypes.object.isRequired,
};


export default ModalItem;
