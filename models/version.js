const { Model } = require('sequelize');
const fs = require('fs-extra');
const sharp = require('sharp');

const s3 = require('../lib/s3');

module.exports = (sequelize, DataTypes) => {
  class Version extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Version.belongsTo(models.Photo);
    }

    static async resize(srcPath, destPath, size) {
      const destDirPath = destPath.substring(0, destPath.lastIndexOf('/'));
      fs.ensureDirSync(destDirPath);
      await sharp(srcPath).resize(size, size, { fit: 'inside' }).jpeg().toFile(destPath);
    }

    static async generateThumbnails(id, prevPath, newPath) {
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
          await Version.resize(filePath, filePath.replace('/file/', '/thumb/'), 600);
          await Version.resize(filePath, filePath.replace('/file/', '/large/'), 1500);
          await s3.putObject(newPath.replace('/file/', '/thumb/'), filePath.replace('/file/', '/thumb/'));
          await s3.putObject(newPath.replace('/file/', '/large/'), filePath.replace('/file/', '/large/'));
        } else {
          await Version.resize(newPath, newPath.replace('/file/', '/thumb/'), 600);
          await Version.resize(newPath, newPath.replace('/file/', '/large/'), 1500);
        }
      }
      const version = await Version.findByPk(id, { include: 'Photo' });
      await version.Photo.update({
        thumbUrl: version.thumbUrl,
        largeUrl: version.largeUrl,
      });
    }
  }

  Version.init(
    {
      file: DataTypes.TEXT,
      filename: DataTypes.TEXT,
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
    },
    {
      sequelize,
      modelName: 'Version',
    }
  );

  Version.afterSave(async (version, options) => {
    version.handleAssetFile('file', options, Version.generateThumbnails);
  });

  return Version;
};
