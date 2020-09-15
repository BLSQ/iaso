import React from 'react';
import ObjectDumper from './ObjectDumper';

const DerivedQuestionMappingForm = ({ mapping, question, mappingVersion }) => (
    <>
        <h2>Aggregation</h2>
        {mappingVersion.derivate_settings.aggregations
            .filter(agg => agg.id == question.name)
            .map(agg => (
                <ObjectDumper key={agg.id} object={agg} />
            ))}
    </>
);
export default DerivedQuestionMappingForm;
