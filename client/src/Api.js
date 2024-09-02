import axios from 'axios';

const instance = axios.create({
  headers: {
    Accept: 'application/json',
  },
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      window.location = '/login';
    }
    return Promise.reject(error);
  }
);

function parseLinkHeader(response) {
  const link = response.headers?.link;
  if (link) {
    const linkRe = /<([^>]+)>; rel="([^"]+)"/g;
    const urls = {};
    let m;
    while ((m = linkRe.exec(link)) !== null) {
      let url = m[1];
      urls[m[2]] = url;
    }
    return urls;
  }
  return null;
}

const Api = {
  parseLinkHeader,
  assets: {
    create(data) {
      return instance.post('/api/assets', data);
    },
    upload(url, headers, file) {
      return instance.put(url, file, { headers });
    },
  },
  auth: {
    login(email, password) {
      return instance.post('/api/auth/login', { email, password });
    },
    logout() {
      return instance.get('/api/auth/logout');
    },
    register(data) {
      return instance.post('/api/auth/register', data);
    },
  },
  comments: {
    create(data) {
      return instance.post('/api/comments', data);
    },
    update(id, data) {
      return instance.patch(`/api/comments/${id}`, data);
    },
    delete(id) {
      return instance.delete(`/api/comments/${id}`);
    },
  },
  invites: {
    index() {
      return instance.get(`/api/invites`);
    },
    create(data) {
      return instance.post('/api/invites', data);
    },
    get(id) {
      return instance.get(`/api/invites/${id}`);
    },
    accept(id, data) {
      return instance.post(`/api/invites/${id}/accept`, data);
    },
    resend(id) {
      return instance.post(`/api/invites/${id}/resend`);
    },
    revoke(id) {
      return instance.delete(`/api/invites/${id}`);
    },
  },
  meetings: {
    index(year, page) {
      const params = {};
      if (year) {
        params.year = year;
      }
      if (page) {
        params.page = page;
      }
      return instance.get(`/api/meetings`, { params });
    },
    create(data) {
      return instance.post('/api/meetings', data);
    },
    get(id) {
      return instance.get(`/api/meetings/${id}`);
    },
    submit(id, data) {
      return instance.post(`/api/meetings/${id}/submissions`, data);
    },
    update(id, data) {
      return instance.patch(`/api/meetings/${id}`, data);
    },
  },
  meetingTemplates: {
    index() {
      return instance.get('/api/meetings/templates');
    },
    get(id) {
      return instance.get(`/api/meetings/templates/${id}`);
    },
    update(id, data) {
      return instance.patch(`/api/meetings/templates/${id}`, data);
    },
  },
  passwords: {
    reset(email) {
      return instance.post('/api/passwords', { email });
    },
    get(token) {
      return instance.get(`/api/passwords/${token}`);
    },
    update(token, password) {
      return instance.patch(`/api/passwords/${token}`, { password });
    },
  },
  photos: {
    index({ userId, year, page, sort }) {
      const params = { userId, page, sort };
      if (year && year !== 'all') {
        params.year = year;
        delete params.page;
        delete params.sort;
      }
      return instance.get('/api/photos', { params });
    },
    random() {
      return instance.get(`/api/photos/random`);
    },
    get(id) {
      return instance.get(`/api/photos/${id}`);
    },
    create(data) {
      return instance.post('/api/photos', data);
    },
    update(id, data) {
      return instance.patch(`/api/photos/${id}`, data);
    },
    rate(id, value) {
      return instance.post(`/api/photos/${id}/rate`, { value });
    },
    feature(id, year, position) {
      return instance.post(`/api/photos/${id}/feature`, { year, position });
    },
    delete(id) {
      return instance.delete(`/api/photos/${id}`);
    },
  },
  users: {
    index(args) {
      const { showAll } = args ?? {};
      const params = { showAll };
      return instance.get(`/api/users`, { params });
    },
    me() {
      return instance.get('/api/users/me');
    },
    get(id) {
      return instance.get(`/api/users/${id}`);
    },
    update(id, data) {
      return instance.patch(`/api/users/${id}`, data);
    },
    deactivate(id) {
      return instance.delete(`/api/users/${id}`);
    },
  },
};

export default Api;
