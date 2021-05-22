import React from 'react';
import PropTypes from 'prop-types';
import ObjectDumper from './ObjectDumper';

const DerivedQuestionMappingForm = ({ question, mappingVersion }) => (
    <>
        <h2>Aggregation</h2>
        {mappingVersion.derivate_settings.aggregations
            .filter(agg => agg.id === question.name)
            .map(agg => (
                <ObjectDumper key={agg.id} object={agg} />
            ))}
    </>
);

DerivedQuestionMappingForm.propTypes = {
    question: PropTypes.object.isRequired,
    mappingVersion: PropTypes.object.isRequired,
};

export default DerivedQuestionMappingForm;
