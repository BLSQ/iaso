import React from 'react';
import { renderWithMuiTheme } from '../../../../test/utils/muiTheme';
import { EditableTextFields } from './EditableTextFields';
import { renderWithIntl } from '../../../../test/utils/intl';
import InputComponent from './InputComponent';

const onChange1 = sinon.spy();
const onChange2 = sinon.spy();

const initialValues = ['initialValue1', 'initialValue2'];
const updatedValues = ['newValue1', 'newValue2'];
const updaters = [onChange1, onChange2];

const defaultProps = [
    {
        keyValue: 'keyValue',
        label: { id: 'label', defaultMessage: 'label' },
        value: initialValues[0],
        onChange: updaters[0],
    },
    {
        keyValue: 'keyValue2',
        label: { id: 'label2', defaultMessage: 'label2' },
        value: initialValues[1],
        onChange: updaters[1],
        password: true,
    },
];

let component;
let inputs;

const renderComponent = props => {
    return mount(
        renderWithIntl(
            renderWithMuiTheme(<EditableTextFields fields={props} />),
        ),
    );
};

describe('EditableTextFields', () => {
    beforeEach(() => {
        component = renderComponent(defaultProps);
        component.update();
        inputs = component.find('input');
    });
    it('renders', () => {
        expect(component.exists()).to.equal(true);
        expect(inputs.length).to.equal(2);
    });
    it('typing text triggers onChange', async () => {
        for (let i = 0; i < inputs.length; i += 1) {
            const input = component.find('input').at(i);
            input.simulate('change', {
                target: { value: updatedValues[i] },
            });
            expect(updaters[i]).to.have.been.calledOnce;
        }
    });
    it('"password" props hides text', () => {
        // targeting input tag i.o. InputComponent to make test more resilient
        expect(inputs.at(0).instance().type).to.equal('text');
        expect(inputs.at(1).instance().type).to.equal('password');
    });
    // No behaviour directly attached so testing implementation
    it('assigns default value to InputComponent error prop', () => {
        for (let i = 0; i < inputs.length; i += 1) {
            const inputComponent = component.find(InputComponent).at(i);
            expect(inputComponent.props().errors).to.deep.equal([]);
        }
    });
    // No behaviour directly attached so testing implementation
    it('assigns prop value to InputComponent error prop', () => {
        const errorProps = [...defaultProps];
        const error = ['errors'];
        errorProps[0].errors = error;
        const errorComponent = renderComponent(errorProps);
        const inputComponent = errorComponent.find(InputComponent).at(0);
        expect(inputComponent.props().errors).to.deep.equal(error);
    });
});
