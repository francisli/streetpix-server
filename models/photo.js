const ExifReader = require('exifreader');
const _ = require('lodash');
const { DateTime } = require('luxon');
const { Model, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Photo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Photo.hasMany(models.Rating);
      Photo.hasMany(models.Version);
      Photo.hasOne(models.Feature);
      Photo.hasOne(models.MeetingSubmission);
      Photo.belongsTo(models.User);
    }

    async updateMetadata(version, options = {}) {
      const { transaction } = options;
      const filePath = await version.getAssetFile('file');
      if (!filePath) {
        return null;
      }
      const tags = await ExifReader.load(filePath, { expanded: true });
      const attributes = {
        metadata: _.pick(tags, ['file', 'gps', 'exif', 'iptc', 'icc']),
      };
      // extract original photo date
      let takenAt = null;
      const dateTimeDigitized = tags?.exif?.DateTimeDigitized?.value?.[0];
      const offsetTimeDigitized = tags?.exif?.OffsetTimeDigitized?.value?.[0] ?? tags?.exif?.OffsetTime?.value?.[0];
      if (dateTimeDigitized && offsetTimeDigitized) {
        takenAt = DateTime.fromFormat(`${dateTimeDigitized}${offsetTimeDigitized ?? ''}`, 'yyyy:MM:dd HH:mm:ssZZ');
      }
      if (takenAt) {
        attributes.takenAt = takenAt;
      }
      return this.update(attributes, { transaction });
    }

    async updateRating(options = {}) {
      const { transaction } = options;
      const ratings = await this.getRatings({
        where: {
          UserId: {
            [Op.ne]: this.UserId,
          },
        },
        transaction,
      });
      let rating = 0;
      if (ratings.length > 0) {
        let sum = 0;
        ratings.forEach((r) => {
          sum += r.value;
        });
        rating = sum / ratings.length;
      }
      await this.update({ rating }, { transaction });
    }

    toJSON() {
      const json = _.pick(this.get(), [
        'id',
        'thumbUrl',
        'largeUrl',
        'caption',
        'description',
        'license',
        'acquireLicensePage',
        'UserId',
        'takenAt',
        'createdAt',
        'updatedAt',
      ]);
      if (this.User) {
        json.User = this.User.toJSON();
      }
      if (this.Feature) {
        json.Feature = this.Feature.toJSON();
      }
      if (this.MeetingSubmission && this.MeetingSubmission.Meeting) {
        json.MeetingSubmission = {
          Meeting: {
            startsAt: this.MeetingSubmission.Meeting.startsAt,
          },
        };
      }
      if (this.Ratings) {
        json.Ratings = this.Ratings.map((r) => r.toJSON());
      }
      return json;
    }
  }
  Photo.init(
    {
      filename: DataTypes.TEXT,
      file: DataTypes.TEXT,
      thumbUrl: DataTypes.TEXT,
      largeUrl: DataTypes.TEXT,
      caption: DataTypes.TEXT,
      description: DataTypes.TEXT,
      notes: DataTypes.TEXT,
      metadata: DataTypes.JSONB,
      license: DataTypes.TEXT,
      acquireLicensePage: DataTypes.TEXT,
      rating: DataTypes.FLOAT,
      takenAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Photo',
    }
  );

  Photo.afterSave(async (photo, options) => {
    photo.handleAssetFile('file', options, Photo.generateThumbnails);
  });

  return Photo;
};
