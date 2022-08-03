const assert = require('assert');

const helper = require('../helper');
const models = require('../../models');

describe('models.Rating', () => {
  beforeEach(async () => {
    await helper.loadUploads([
      ['512x512.png', 'e6ecab76-48ca-4a89-8593-281153dff454.jpg'],
      ['512x512.png', 'ea92aaca-4fa3-4ff7-96e9-dd0db71b5143.jpg'],
      ['512x512.png', 'd0cb02d1-e95f-4d05-8b90-f2db36357e83.jpg'],
    ]);
    await helper.loadFixtures(['users', 'photos']);
  });

  it('creates a new Rating record', async () => {
    const rating = await models.Rating.create({
      PhotoId: 'e6ecab76-48ca-4a89-8593-281153dff454',
      UserId: 2,
      value: 1,
    });
    assert(rating.id);
    assert.deepStrictEqual(rating.value, 1);

    const photo = await rating.getPhoto();
    assert.deepStrictEqual(photo.rating, 1);
  });

  it('updates the Photo record with average rating', async () => {
    await models.Rating.create({
      PhotoId: 'e6ecab76-48ca-4a89-8593-281153dff454',
      UserId: 2,
      value: 1,
    });
    const rating = await models.Rating.create({
      PhotoId: 'e6ecab76-48ca-4a89-8593-281153dff454',
      UserId: 3,
      value: 2,
    });
    const photo = await rating.getPhoto();
    assert.deepStrictEqual(photo.rating, 1.5);
  });

  it('updates the Photo record after deletion', async () => {
    const rating = await models.Rating.create({
      PhotoId: 'e6ecab76-48ca-4a89-8593-281153dff454',
      UserId: 2,
      value: 1,
    });
    const photo = await rating.getPhoto();
    assert.deepStrictEqual(photo.rating, 1);

    await rating.destroy();
    await photo.reload();
    assert.deepStrictEqual(photo.rating, 0);
  });
});
