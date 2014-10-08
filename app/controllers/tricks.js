var mongoose = require('mongoose');
var Trick = mongoose.model('Trick');
var tricks = require('express').Router();
var config = require('../config/config');
var request = require('request');
var _ = require('lodash');

/**
 * New Trick
 */

exports.create = function (req, res) {
  res.render('tricks/new', {
    title: 'New Theater',
    trick: new Trick({})
  });
};

exports.myTrick = function (req, res) {
  var current_username = req.user.username;
  var username_params = req.params.username;

  if (current_username !== username_params) {
    res.redirect('/' + username_params);
  }

  var page = req.param('page') || 0;
  res.render('tricks/tricks-user', {
    title: 'My Theater',
    page: page,
    origin_url: '/' + current_username + '/tricks/'
  });
};

exports.homeTrick = function (req, res) {
  var page = req.param('page') || 0;
  res.render('index', {
    title: 'HomePage',
    page: page,
    origin_url: '/hall/'
  });
};

exports.deleteTrick = function(req, res) {
  var trickD = req.trick;
  var itemId = req.param('itemId');
  var redirectUrl = req.param('redirectUrl');
  res.redirect(redirectUrl);
};