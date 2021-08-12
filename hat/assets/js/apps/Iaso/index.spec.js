import ConnectedApp from './index';

describe('Main app component', () => {
    it('mount properly', () => {
        const app = document.createElement('DIV');
        app.id = 'app';
        expect(ConnectedApp(app, [])).to.be.undefined;
    });
});
