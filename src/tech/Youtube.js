/**
 * @file Youtube.js
 * Externals (iframe) Media Controller - Wrapper for HTML5 Media API
 */
import videojs from 'video.js';
import Externals from './Externals';

const Component = videojs.getComponent('Component');
const Tech = videojs.getComponent('Tech');

/**
 * Externals Media Controller - Wrapper for HTML5 Media API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @extends Tech
 * @class Youtube
 */

class Youtube extends Externals {
  constructor (options, ready) {
    super(options, ready);
  }

  createEl () {
    let youtubeSource = null;
    if ('string' === typeof this.options_.source) {
      youtubeSource = this.options_.source;
    }
    else if ('object' === typeof this.options_.source) {
      youtubeSource = this.options_.source.src;
    }

    youtubeSource = this.parseSrc(youtubeSource);

    const el_ = super.createEl('div', {
      id: this.options_.techId,
      style: 'width:100%;height:100%;top:0;left:0;position:absolute',
      src: `http://www.youtube.com/embed/${youtubeSource}?enablejsapi=1&origin=http://127.0.0.1:9999`
    });

    el_.style.visibility = this.options_.visibility;

    return el_;
  }

  loadApi () {
    super.loadApi();
    window.onYouTubeIframeAPIReady = this.onYoutubeReady.bind(this);
  }

  onStateChange (event) {
    let state = JSON.parse(event.data);
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

  parseSrc (src) {
    if (src) {
      // Regex that parse the video ID for any Dailymotion URL
      var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = src.match(regExp);

      if (match && match[2].length === 11) {
        return match[2];
      }
    }
  }

  onReady () {
    super.onReady();
  }

  onYoutubeReady () {
    for (let i = 0; i < Youtube.apiReadyQueue.length; ++i) {
      this.apiReadyQueue[i].onYoutubeReady();
    }
    let source = null;
    if ('string' === typeof this.options_.source) {
      source = this.options_.source;
    }
    else if ('object' === typeof this.options_.source) {
      source = this.options_.source.src;
    }

    source = this.parseSrc(source);

    const ytOpts = videojs.mergeOptions(this.options_, {
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

  isApiReady () {
    return window['YT'];
  }

  setupTriggers () {
  }

  onPlayerPlaybackQualityChange () {

  }


  src (source) {

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

  ended () {
    return this.widgetPlayer ? (this.lastState === YT.PlayerState.ENDED) : false;
  }

  duration () {
    return this.widgetPlayer ? this.widgetPlayer.getDuration() : 0;
  }

  currentTime () {
    return this.widgetPlayer && this.widgetPlayer.getCurrentTime();
  }


  setCurrentTime (seconds) {
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
      this.checkSeekedInPauseInterval = this.setInterval(function () {
        if (this.lastState !== YT.PlayerState.PAUSED || !this.isSeeking) {
          // If something changed while we were waiting for the currentTime to change,
          //  clear the interval timer
          this.clearInterval(this.checkSeekedInPauseInterval);
        } else if (this.currentTime() !== this.timeBeforeSeek) {
          this.trigger('timeupdate');
          this.onSeeked();
        }
      }.bind(this), 250);
    }
  }

  onSeeked () {
    this.clearInterval(this.checkSeekedInPauseInterval);
    this.isSeeking = false;
    this.trigger('seeked');
  }

  updateVolume () {
    this.volume_ = this.widgetPlayer.getVolume();
    this.trigger('volumechange');
  }

  play () {
    this.widgetPlayer.playVideo();
  }

  pause () {
    this.widgetPlayer.pauseVideo();
  }

  paused () {
    return true;
  }

  muted () {
    return this.muted_;
  }

  volume () {
    return this.widgetPlayer && this.widgetPlayer.getVolume() / 100.0;
  }

  setVolume (percentAsDecimal) {
    if (percentAsDecimal !== this.volume_) {
      this.widgetPlayer.setVolume(percentAsDecimal * 100.0);
      this.updateVolume();
    }
  }

  setMuted (muted) {
    this.muted_ = muted;
    this.widgetPlayer.setVolume(muted ? 0 : this.volume_);
    this.updateVolume();
  }
}

Youtube.prototype.options_ = {
  api: '//www.youtube.com/iframe_api',
  visibility: 'visible'
  //children: ['posterImage'],
};

Externals.prototype.className_ = 'youtube';

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
  return (source.indexOf('youtube') !== -1);
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
Youtube.nativeSourceHandler.dispose = function () {
};


Youtube.Events = 'ready,play,playProgress,loadProgress,pause,seek,finish,error'.split(',');

// Register the native source handler
Youtube.registerSourceHandler(Youtube.nativeSourceHandler);

Component.registerComponent('Youtube', Youtube);

Tech.registerTech('Youtube', Youtube);


export default Youtube;
