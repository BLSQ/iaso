import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';

import { Layout } from './components/Layout';

function App() {
    return (
        <Router>
            <div>
                <Switch>
                    <Route path="/">
                        <Dashboard />
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}

export default App;
