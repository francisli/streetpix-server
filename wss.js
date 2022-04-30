const querystring = require('querystring');
const url = require('url');
const WebSocket = require('ws');
const models = require('./models');

const photoServer = new WebSocket.Server({ noServer: true });
photoServer.on('connection', async (ws, req) => {
  const userId = req.user.id;
  const photoId = req.photo.id;
  // eslint-disable-next-line no-param-reassign
  ws.info = { userId, photoId };
  ws.on('message', async (data) => {
    // broadcast back to other users viewing the same photo
    const payload = data.toString();
    photoServer.clients.forEach((client) => {
      if (client.info.photoId === photoId && client.info.userId !== userId) {
        client.send(payload);
      }
    });
  });
  ws.send(JSON.stringify({ timestamp: new Date().getTime() }));
});

function configure(server, app) {
  server.on('upgrade', (req, socket, head) => {
    app.sessionParser(req, {}, async () => {
      const query = querystring.parse(url.parse(req.url).query);
      // ensure user logged in
      if (req.session?.passport?.user) {
        req.user = await models.User.findByPk(req.session.passport.user);
      }
      if (!req.user) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      // connect based on pathname
      const { pathname } = url.parse(req.url);
      switch (pathname) {
        case '/photo':
          if (query.id && query.id !== 'undefined') {
            req.photo = await models.Photo.findByPk(query.id);
          }
          if (!req.photo) {
            socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
            socket.destroy();
            return;
          }
          photoServer.handleUpgrade(req, socket, head, (ws) => {
            photoServer.emit('connection', ws, req);
          });
          break;
        default:
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
      }
    });
  });
}

module.exports = {
  configure,
};
