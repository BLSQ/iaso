import React from 'react';
import { Select, useSafeIntl } from 'bluesquare-components';
import PropTypes from 'prop-types';
import { useDataSourceVersions } from '../../domains/dataSources/requests';
import { versionsAsOptionsWithSourceName } from '../../domains/dataSources/utils';

const SourceVersionSelector = props => {
    const { data: sourceVersions, isLoading: areSourceVersionsLoading } =
        useDataSourceVersions();

    const { formatMessage } = useSafeIntl();
    return (
        <Select
            type="select"
            keyValue="source_version"
            label={props.label}
            value={props.value}
            errors={props.errors}
            onChange={props.onChange}
            options={versionsAsOptionsWithSourceName({
                formatMessage,
                versions: sourceVersions,
            })}
            loading={areSourceVersionsLoading}
            required={props.required}
        />
    );
};

SourceVersionSelector.defaultProps = {
    errors: [],
    label: 'Source Version',
    required: false,
};

SourceVersionSelector.propTypes = {
    label: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.any.isRequired,
    errors: PropTypes.arrayOf(PropTypes.string),
    required: PropTypes.bool,
};

export default SourceVersionSelector;
