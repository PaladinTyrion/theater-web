var config = require('../../config/config');
var mongoose = require('mongoose');
var Trick = mongoose.model('Trick');
var utils = require(config.root + '/app/helper/utils');
var screenshot = require('url-to-screenshot');
var crypto = require('crypto');
var request = require('request');
var fs = require('fs');
var _ = require('lodash');

exports.load = function (req, res, next) {
  Trick.load(req.params.trickId, function (err, trick) {
    req.trick = trick;
    next();
  });
};
/**
 * Create an Tricks
 * POST : '/api/trick/create'
 */
exports.create = function (req, res, next) {
  var trick = new Trick(req.body);
  trick.user = req.user;
  trick.screenShoot(res, req.body.origin_url, next);
};

exports.delete = function (req, res, next) {

  var trick = req.trick;

  var data = req.body;

  if (!_.isEmpty(data) && _.isObject(data)) {
    trick = _.assign(trick, data);
  }

  trick.is_active = false;
  trick.updatedAt = new Date().toISOString();

  trick.save(function (err, doc) {

    if (err) return utils.responses(res, 500, err);

    return utils.responses(res, 200, trick);
  });
};

exports.getAll = function (req, res, next) {

  var page = (req.query.page > 0 ? req.query.page : 1) - 1 || 0;
  var perPage = 12;
  var options = {
    perPage: perPage,
    page: page
  };

  var condition = { is_active: true };

  Trick.find(condition).sort({createdAt: -1}).skip(options.perPage * options.page).limit(options.perPage).populate('user', 'username photo_profile email').exec(function (err, tricks) {

    if (err) return utils.responses(res, 500, err);

    Trick.count(condition, function (err, count) {

      if (err) return errorHelper.mongoose(res, err);

      return utils.responses(res, 200, { tricks: tricks, tricks_count: count});

    });
  });
};

exports.listTrickByUser = function (req, res, next) {

  var user_id = req.query.user_id;

  var page = (req.query.page > 0 ? req.query.page : 1) - 1 || 0;

//  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = 12;
  var options = {
    perPage: perPage,
    page: page
  };

  var condition = {
    $and: [
      { user: user_id },
      { is_active: true }
    ]
  };

  Trick.find(condition).sort({createdAt: -1}).skip(options.perPage * options.page).limit(options.perPage).populate('user', 'username photo_profile email').exec(function (err, tricks) {
    if (err) return utils.responses(res, 500, err);
    Trick.count(condition, function (err, count) {
      if (err) return errorHelper.mongoose(res, err);
      return utils.responses(res, 200, { tricks: tricks, tricks_count: count});
    });
  });
};

exports.screenShootUrl = function (req, res) {
  var Url = req.query.origin_url;

  if (Url) {
    var opts = {
      format: 'png',
      width: 760,
      height: 576
    };

    var makeSalt = Math.round((new Date().valueOf() * Math.random())) + '';

    var hasFileName = crypto.createHmac('sha1', makeSalt).update(Url).digest('hex');

    var location_screenshoot = config.root + '/public/screenshot/' + hasFileName + '.' + opts.format;

    request(Url, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        screenshot(Url).width(opts.width).height(opts.height).capture(function (err, img) {

          if (err) {
            renderDefaultImage(res);
            // throw err;
          }
          res.set('Content-Type', 'image/png');
          res.send(new Buffer(img));
        });
      } else {
        renderDefaultImage(res);
      }
    });
  } else {
    renderDefaultImage(res);
  }
};

var renderDefaultImage = function (res) {
  var readStream = fs.createReadStream(config.root + '/public/img/photo.png');

  res.set('Content-Type', 'image/png');

  readStream.on('data', function (data) {
    res.send(new Buffer(data));
  });
};

//costomized
exports.deleteOneTrick = function (trick, next) {

  if(!trick) return next();

  var deleteshot = trick.screenshot;

  var file_screenshoot = config.root + '/public/screenshot/' + deleteshot;
  //var file_tmpscreenshoot = config.root + '/public/screenshot/tmp/' + deleteshot;

  trick.remove(function (err) {
    if (err) return next(err);

    //delete screenshot image
    fs.unlink(file_screenshoot, function(err) {
      if (err) return next(err);
      //fs.unlink(file_tmpscreenshoot, function(err) {
      //  if (err) return next(err);
      //  return next();
      //});
      return next();
    });


  });

};
