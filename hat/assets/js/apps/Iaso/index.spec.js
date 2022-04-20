import ConnectedApp from './index';

describe('Main app component', () => {
    it('mount properly', () => {
        const app = document.createElement('DIV');
        app.id = 'app';
        expect(
            ConnectedApp(app, [], {
                THEME_PRIMARY_COLOR: 'red',
                THEME_SECONDARY_COLOR: 'red',
                THEME_PRIMARY_BACKGROUND_COLOR: 'red',
            }),
        ).to.be.undefined;
    });
});
