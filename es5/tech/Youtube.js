/**
 * @file Youtube.js
 * Externals (iframe) Media Controller - Wrapper for HTML5 Media API
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _videoJs = require('video.js');

var _videoJs2 = _interopRequireDefault(_videoJs);

var _Externals2 = require('./Externals');

var _Externals3 = _interopRequireDefault(_Externals2);

var Component = _videoJs2['default'].getComponent('Component');
var Tech = _videoJs2['default'].getComponent('Tech');

/**
 * Externals Media Controller - Wrapper for HTML5 Media API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @extends Tech
 * @class Youtube
 */

var Youtube = (function (_Externals) {
  _inherits(Youtube, _Externals);

  function Youtube(options, ready) {
    _classCallCheck(this, Youtube);

    _get(Object.getPrototypeOf(Youtube.prototype), 'constructor', this).call(this, options, ready);
  }

  _createClass(Youtube, [{
    key: 'createEl',
    value: function createEl() {
      var youtubeSource = null;
      if ('string' === typeof this.options_.source) {
        youtubeSource = this.options_.source;
      } else if ('object' === typeof this.options_.source) {
        youtubeSource = this.options_.source.src;
      }

      youtubeSource = this.parseSrc(youtubeSource);

      var el_ = _get(Object.getPrototypeOf(Youtube.prototype), 'createEl', this).call(this, 'div', {
        id: this.options_.techId,
        style: 'width:100%;height:100%;top:0;left:0;position:absolute',
        src: 'http://www.youtube.com/embed/' + youtubeSource + '?enablejsapi=1&origin=http://127.0.0.1:9999'
      });

      el_.style.visibility = this.options_.visibility;

      return el_;
    }
  }, {
    key: 'loadApi',
    value: function loadApi() {
      _get(Object.getPrototypeOf(Youtube.prototype), 'loadApi', this).call(this);
      window.onYouTubeIframeAPIReady = this.onYoutubeReady.bind(this);
    }
  }, {
    key: 'onStateChange',
    value: function onStateChange(event) {
      var state = JSON.parse(event.data);
      switch (state.info) {
        case -1:
          this.trigger('loadstart');
          this.trigger('loadedmetadata');
          this.trigger('durationchange');
          break;

        case YT.PlayerState.PLAYING:
          this.trigger('timeupdate');
          this.trigger('durationchange');
          this.trigger('playing');
          this.trigger('play');

          if (this.isSeeking) {
            this.onSeeked();
          }
          break;

        case YT.PlayerState.ENDED:
          this.trigger('ended');
          break;

        case YT.PlayerState.PAUSED:
          this.trigger('canplay');
          if (this.isSeeking) {
            this.onSeeked();
          } else {
            this.trigger('pause');
          }
          break;

        case YT.PlayerState.BUFFERING:
          this.player_.trigger('timeupdate');
          this.player_.trigger('waiting');
          break;
      }
      this.lastState = state.info;
    }
  }, {
    key: 'parseSrc',
    value: function parseSrc(src) {
      if (src) {
        // Regex that parse the video ID for any Dailymotion URL
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = src.match(regExp);

        if (match && match[2].length === 11) {
          return match[2];
        }
      }
    }
  }, {
    key: 'onReady',
    value: function onReady() {
      _get(Object.getPrototypeOf(Youtube.prototype), 'onReady', this).call(this);
    }
  }, {
    key: 'onYoutubeReady',
    value: function onYoutubeReady() {
      for (var i = 0; i < Youtube.apiReadyQueue.length; ++i) {
        this.apiReadyQueue[i].onYoutubeReady();
      }
      var source = null;
      if ('string' === typeof this.options_.source) {
        source = this.options_.source;
      } else if ('object' === typeof this.options_.source) {
        source = this.options_.source.src;
      }

      source = this.parseSrc(source);

      var ytOpts = _videoJs2['default'].mergeOptions(this.options_, {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        autohide: 1,
        disablekb: 1,
        end: 0,
        fs: 1
      });

      this.widgetPlayer = new YT.Player(this.options_.techId, {
        videoId: source,
        playerVars: ytOpts,
        events: {
          onReady: this.onReady.bind(this),
          onPlaybackQualityChange: this.onPlayerPlaybackQualityChange.bind(this),
          onStateChange: this.onStateChange.bind(this),
          onError: this.onPlayerError.bind(this)
        }
      });
    }
  }, {
    key: 'isApiReady',
    value: function isApiReady() {
      return window['YT'];
    }
  }, {
    key: 'setupTriggers',
    value: function setupTriggers() {}
  }, {
    key: 'onPlayerPlaybackQualityChange',
    value: function onPlayerPlaybackQualityChange() {}
  }, {
    key: 'src',
    value: function src(source) {

      if (!source || !source.src) {
        return;
      }

      this.url = this.parseSrc(source.src);

      if (!this.options_.poster) {
        if (this.url) {
          // Set the low resolution first
          this.setPoster('https://img.youtube.com/vi/' + this.url + '/0.jpg');
        }
      }
    }
  }, {
    key: 'ended',
    value: function ended() {
      return this.widgetPlayer ? this.lastState === YT.PlayerState.ENDED : false;
    }
  }, {
    key: 'duration',
    value: function duration() {
      return this.widgetPlayer ? this.widgetPlayer.getDuration() : 0;
    }
  }, {
    key: 'currentTime',
    value: function currentTime() {
      return this.widgetPlayer && this.widgetPlayer.getCurrentTime();
    }
  }, {
    key: 'setCurrentTime',
    value: function setCurrentTime(seconds) {
      if (this.lastState === YT.PlayerState.PAUSED) {
        this.timeBeforeSeek = this.currentTime();
      }

      if (!this.isSeeking) {
        this.wasPausedBeforeSeek = this.paused();
      }

      this.widgetPlayer.seekTo(seconds, true);
      this.trigger('timeupdate');
      this.trigger('seeking');
      this.isSeeking = true;

      // A seek event during pause does not return an event to trigger a seeked event,
      // so run an interval timer to look for the currentTime to change
      if (this.lastState === YT.PlayerState.PAUSED && this.timeBeforeSeek !== seconds) {
        this.clearInterval(this.checkSeekedInPauseInterval);
        this.checkSeekedInPauseInterval = this.setInterval((function () {
          if (this.lastState !== YT.PlayerState.PAUSED || !this.isSeeking) {
            // If something changed while we were waiting for the currentTime to change,
            //  clear the interval timer
            this.clearInterval(this.checkSeekedInPauseInterval);
          } else if (this.currentTime() !== this.timeBeforeSeek) {
            this.trigger('timeupdate');
            this.onSeeked();
          }
        }).bind(this), 250);
      }
    }
  }, {
    key: 'onSeeked',
    value: function onSeeked() {
      this.clearInterval(this.checkSeekedInPauseInterval);
      this.isSeeking = false;
      this.trigger('seeked');
    }
  }, {
    key: 'updateVolume',
    value: function updateVolume() {
      this.volume_ = this.widgetPlayer.getVolume();
      this.trigger('volumechange');
    }
  }, {
    key: 'play',
    value: function play() {
      this.widgetPlayer.playVideo();
    }
  }, {
    key: 'pause',
    value: function pause() {
      this.widgetPlayer.pauseVideo();
    }
  }, {
    key: 'paused',
    value: function paused() {
      return true;
    }
  }, {
    key: 'muted',
    value: function muted() {
      return this.muted_;
    }
  }, {
    key: 'volume',
    value: function volume() {
      return this.widgetPlayer && this.widgetPlayer.getVolume() / 100.0;
    }
  }, {
    key: 'setVolume',
    value: function setVolume(percentAsDecimal) {
      if (percentAsDecimal !== this.volume_) {
        this.widgetPlayer.setVolume(percentAsDecimal * 100.0);
        this.updateVolume();
      }
    }
  }, {
    key: 'setMuted',
    value: function setMuted(muted) {
      this.muted_ = muted;
      this.widgetPlayer.setVolume(muted ? 0 : this.volume_);
      this.updateVolume();
    }
  }]);

  return Youtube;
})(_Externals3['default']);

Youtube.prototype.options_ = {
  api: '//www.youtube.com/iframe_api',
  visibility: 'visible'
  //children: ['posterImage'],
};

_Externals3['default'].prototype.className_ = 'youtube';

Youtube.apiReadyQueue = [];

/* Youtube Support Testing -------------------------------------------------------- */

Youtube.isSupported = function () {
  return true;
};

// Add Source Handler pattern functions to this tech
Tech.withSourceHandlers(Youtube);

/*
 * The default native source handler.
 * This simply passes the source to the video element. Nothing fancy.
 *
 * @param  {Object} source   The source object
 * @param  {Flash} tech  The instance of the Flash tech
 */
Youtube.nativeSourceHandler = {};

/**
 * Check if Flash can play the given videotype
 * @param  {String} type    The mimetype to check
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Youtube.nativeSourceHandler.canPlayType = function (source) {
  return source.indexOf('youtube') !== -1;
};

/*
 * Check Youtube can handle the source natively
 *
 * @param  {Object} source  The source object
 * @return {String}         'probably', 'maybe', or '' (empty string)
 */
Youtube.nativeSourceHandler.canHandleSource = function (source) {

  // If a type was provided we should rely on that
  if (source.type) {
    return Youtube.nativeSourceHandler.canPlayType(source.type);
  } else if (source.src) {
    return Youtube.nativeSourceHandler.canPlayType(source.src);
  }

  return '';
};

Youtube.nativeSourceHandler.handleSource = function (source, tech) {
  tech.src(source.src);
};

/*
 * Clean up the source handler when disposing the player or switching sources..
 * (no cleanup is needed when supporting the format natively)
 */
Youtube.nativeSourceHandler.dispose = function () {};

Youtube.Events = 'ready,play,playProgress,loadProgress,pause,seek,finish,error'.split(',');

// Register the native source handler
Youtube.registerSourceHandler(Youtube.nativeSourceHandler);

Component.registerComponent('Youtube', Youtube);

Tech.registerTech('Youtube', Youtube);

exports['default'] = Youtube;
module.exports = exports['default'];