import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';
import { DatePicker } from 'bluesquare-components';
import { get } from 'lodash';
import { shortApiDateFormat } from '../../../../../../hat/assets/js/apps/Iaso/utils/dates';

import MESSAGES from '../../constants/messages';

export const DateInput = ({ field, form }) => {
    return (
        <Box mb={2}>
            <DatePicker
                placeholder="DD/MM/YYYY"
                clearMessage={MESSAGES.clear}
                currentDate={field.value || null}
                hasError={form.errors && Boolean(get(form.errors, field.name))}
                onChange={date =>
                    form.setFieldValue(
                        field.name,
                        date ? date.format(shortApiDateFormat) : null,
                    )
                }
            />
        </Box>
    );
};

DateInput.propTypes = {
    field: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
};
