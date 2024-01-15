import { matchPath } from 'react-router-dom';
import { DateTime } from 'luxon';

export const ADMIN_AUTH_PROTECTED_PATHS = ['/admin/*', '/meetings/templates/:meetingId/edit', '/meetings/:meetingId/edit'];
export const AUTH_PROTECTED_PATHS = ['/meetings/*', '/members/:userId/edit'];
export const REDIRECTS = [
  ['/admin', '/admin/members'],
  [
    '/members/:userId',
    (user) => {
      const year = DateTime.now().year - 1;
      return user ? '/members/:userId/all' : `/members/:userId/${year}`;
    },
  ],
  [('/passwords', '/passwords/forgot')],
];

export function handleRedirects(authContext, location, pathname, callback) {
  let match;
  for (const pattern of ADMIN_AUTH_PROTECTED_PATHS) {
    match = matchPath(pattern, pathname);
    if (match) {
      if (!authContext.user) {
        return callback('/login', { from: location });
      } else if (!authContext.user.isAdmin) {
        return callback('/');
      }
      break;
    }
  }
  if (!match) {
    for (const pattern of AUTH_PROTECTED_PATHS) {
      match = matchPath(pattern, pathname);
      if (match) {
        if (!authContext.user) {
          return callback('/login', { from: location });
        }
        break;
      }
    }
  }
  for (const redirect of REDIRECTS) {
    let [src, dest] = redirect;
    match = matchPath(src, pathname);
    if (match) {
      if (typeof dest === 'function') {
        dest = dest(authContext.user);
      }
      if (match.params) {
        for (const key of Object.keys(match.params)) {
          dest = dest.replace(`:${key}`, match.params[key]);
        }
      }
      if (dest !== src) {
        return callback(dest);
      }
      break;
    }
  }
  return false;
}
