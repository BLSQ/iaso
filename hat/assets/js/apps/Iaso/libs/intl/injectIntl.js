import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { patchIntl } from './utils';

const FakeComponent = props => {
    const propsCopy = { ...props };
    const Component = props.component;
    const intlCopy = patchIntl(useIntl());
    delete propsCopy.component;
    delete propsCopy.ref;
    return (
        <Component {...propsCopy} intl={intlCopy} forwardedRef={props.ref} />
    );
};

FakeComponent.defaultProps = {
    ref: undefined,
};

FakeComponent.propTypes = {
    component: PropTypes.any.isRequired,
    ref: PropTypes.object,
};

const newInjectIntl = Component => {
    return React.forwardRef((props, ref) => {
        const propsCopy = {
            ...props,
            component: Component,
            ref,
        };
        return <FakeComponent {...propsCopy} />;
    });
};
export default newInjectIntl;
