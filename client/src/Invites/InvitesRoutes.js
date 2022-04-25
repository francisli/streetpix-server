import { useRouteMatch, Route, Switch } from 'react-router-dom';

import Invite from './Invite';

function InvitesRoutes() {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/:inviteId`}>
        <Invite />
      </Route>
    </Switch>
  );
}

export default InvitesRoutes;
