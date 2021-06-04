import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import {LinkProvider} from 'bluesquare-components';
import {Link} from 'react-router-dom';

function App() {
    return (
        <Router>
            <div>
                <Switch>
                    <Route path="/">
                        <LinkProvider linkComponent={Link}>
                        <Dashboard />
                        </LinkProvider>
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}

export default App;
