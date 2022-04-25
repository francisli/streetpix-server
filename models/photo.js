const fs = require('fs-extra');
const _ = require('lodash');
const { Model } = require('sequelize');
const sharp = require('sharp');

const s3 = require('../lib/s3');

module.exports = (sequelize, DataTypes) => {
  class Photo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Photo.hasOne(models.MeetingSubmission);
      Photo.belongsTo(models.User);
    }

    static async resize(srcPath, destPath, size) {
      const destDirPath = destPath.substring(0, destPath.lastIndexOf('/'));
      fs.ensureDirSync(destDirPath);
      await sharp(srcPath).resize(size, size, { fit: 'inside' }).webp().toFile(destPath);
    }

    static async generateThumbnails(prevPath, newPath) {
      if (prevPath) {
        // remove old thumbnails
        if (process.env.AWS_S3_BUCKET) {
          await s3.deleteObject(prevPath.replace('/file/', '/thumb/'));
          await s3.deleteObject(prevPath.replace('/file/', '/large/'));
        } else {
          fs.removeSync(prevPath.replace('/file/', '/thumb/'));
          fs.removeSync(prevPath.replace('/file/', '/large/'));
        }
      }
      if (newPath) {
        // create thumbnails
        if (process.env.AWS_S3_BUCKET) {
          const filePath = await s3.getObject(newPath);
          await Photo.resize(filePath, filePath.replace('/file/', '/thumb/'), 600);
          await Photo.resize(filePath, filePath.replace('/file/', '/large/'), 1500);
          await s3.putObject(newPath.replace('/file/', '/thumb/'), filePath.replace('/file/', '/thumb/'));
          await s3.putObject(newPath.replace('/file/', '/large/'), filePath.replace('/file/', '/large/'));
        } else {
          await Photo.resize(newPath, newPath.replace('/file/', '/thumb/'), 600);
          await Photo.resize(newPath, newPath.replace('/file/', '/large/'), 1500);
        }
      }
    }

    toJSON() {
      const json = _.pick(this.get(), [
        'id',
        'file',
        'fileUrl',
        'thumbUrl',
        'largeUrl',
        'caption',
        'description',
        'metadata',
        'isPublic',
        'license',
        'acquireLicensePage',
        'UserId',
      ]);
      if (this.User) {
        json.User = this.User.toJSON();
      }
      return json;
    }
  }
  Photo.init(
    {
      file: DataTypes.TEXT,
      fileUrl: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.assetUrl('file');
        },
      },
      thumbUrl: {
        type: DataTypes.VIRTUAL(DataTypes.STRING),
        get() {
          return this.fileUrl.replace('/file/', '/thumb/');
        },
      },
      largeUrl: {
        type: DataTypes.VIRTUAL(DataTypes.STRING),
        get() {
          return this.fileUrl.replace('/file/', '/large/');
        },
      },
      caption: DataTypes.TEXT,
      description: DataTypes.TEXT,
      metadata: DataTypes.JSONB,
      isPublic: DataTypes.BOOLEAN,
      license: DataTypes.TEXT,
      acquireLicensePage: DataTypes.TEXT,
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
