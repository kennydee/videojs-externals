/**
 * @file videojs-externals.js
 * Externals (iframe) Media Controller - Wrapper for HTML5 Media API
 */
import videojs from 'video.js';

const Component = videojs.getComponent('Component');
const Tech = videojs.getComponent('Tech');

/**
 * Externals Media Controller - Wrapper for HTML5 Media API
 *
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready Ready callback function
 * @extends Tech
 * @class Externals
 */

class Externals extends Tech {
  constructor (options, ready) {
    super(options, ready);
    this.params = {
      id: this.options_.techId,
      autoplay: parseInt(options.autoplay),
      chromeless: parseInt(options.controls),
      html: 1,
      info: 1,
      logo: 1,
      controls: 'html',
      wmode: 'opaque',
      format: 'json',
      url: options.source.src
    };

    // If we are not on a server, don't specify the origin (it will crash)
    if (window.location.protocol !== 'file:') {
      this.params.origin = window.location.protocol + '//' + window.location.hostname;
    }

    this.videoId = this.parseSrc(options.source.src);

    this.loadApi();
    this.injectCss();
  }

  injectCss (overrideStyle) {
    let css = // iframe blocker to catch mouse events
      `.vjs-${this.className_} .vjs-iframe-blocker { display: none; }
      .vjs-${this.className_}.vjs-user-inactive .vjs-iframe-blocker { display: block; }
      .vjs-${this.className_} .vjs-poster { background-size: cover; }
      .vjs-${this.className_}-mobile .vjs-big-play-button { display: none; }`;

    if (overrideStyle) {
      css += overrideStyle;
    }

    let head = document.head || document.getElementsByTagName('head')[0];

    let style = document.createElement('style');
    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

  parseSrc (src) {
    return src;
  }

  createEl (type, options) {

    let el = videojs.createEl('div', {
      id: 'vjs-tech' + this.options_.techId,
      className: 'vjs-tech vjs-tech-' + this.className_,
    });

    let iframeContainer = videojs.createEl(type, videojs.mergeOptions({
      id: this.options_.techId,
      scrolling: 'no',
      marginWidth: 0,
      marginHeight: 0,
      frameBorder: 0,
      webkitAllowFullScreen: '',
      mozallowfullscreen: '',
      allowFullScreen: '',
    }, options));

    el.appendChild(iframeContainer);
    const isOnMobile = this.isOnMobile();
    if (!isOnMobile) {
      let divBlocker = videojs.createEl('div',
        {
          className: 'vjs-iframe-blocker',
          style: 'position:absolute;top:0;left:0;width:100%;height:100%'
        });

      // In case the blocker is still there and we want to pause
      divBlocker.onclick = function () {
        this.pause();
      }.bind(this);

      el.appendChild(divBlocker);
    }

    const tagPlayer = videojs(this.options_.playerId);
    tagPlayer.addClass('vjs-' + this.className_ + (isOnMobile ? '-mobile' : ''));

    return el;
  }

  isOnMobile () {
    return videojs.browser.IS_EDGE || videojs.browser.IS_ANDROID || videojs.browser.IS_IOS;
  }

  addScriptTag () {
    var r = false,
      self = this,
      d = document,
      s = d.getElementsByTagName('head')[0] || d.documentElement;
    var js = d.createElement('script');
    js.async = true;
    js.type = 'text/javascript';
    js.onload = js.onreadystatechange = function () {
      var rs = this.readyState;
      if (!r && (!rs || /loaded|complete/.test(rs))) {
        r = true;
        // Handle memory leak in IE
        js.onload = js.onreadystatechange = null;
        self.setupTriggers();
      }
    };

    js.src = this.options_.api;
    s.insertBefore(js, s.firstChild);
  }

  loadApi () {
    if (!this.isApiReady()) {
      this.addScriptTag();

    } else {
      //Add to the queue because the Externals API is not ready
      this.apiReadyQueue.push(this);
    }
  }

  isApiReady () {
    return false;
  }

  setupTriggers () {
    this.widgetPlayer.vjsTech = this;
    this.widgetPlayer.listeners = [];
    for (var i = Externals.Events.length - 1; i >= 0; i--) {
      var listener = videojs.bind(this, this.eventHandler);
      this.widgetPlayer.listeners.push({event: Externals.Events[i], func: listener});
      this.widgetPlayer.addEventListener(Externals.Events[i], listener);
    }
  }

  eventHandler (e) {
    if (!e) {
      return;
    }
    this.onStateChange(e);
    this.trigger(e);
  }

  onStateChange (event) {
    let state = event.type;
    if (state !== this.lastState) {
      this.lastState = state;
    }
  }

  onReady () {
    this.triggerReady();
  }

  poster () {
    return this.poster_;
  }

  setPoster (poster) {
    this.poster_ = poster;
    this.trigger('posterchange');
  }

  /**
   * Set video
   *
   * @param {Object=} src Source object
   * @method setSrc
   */
  src (src) {
    if (typeof src !== 'undefined') {
      this.src_ = this.parseSrc(src);
    }
    return this.src_;
  }

  currentSrc () {
    return this.src_;
  }

  play () {
  }

  ended () {
    if (this.isReady_) {
      return this.lastState === 0;
    } else {
      // We will play it when the API will be ready
      return false;
    }
  }

  pause () {
  }

  paused () {
    return false;
  }

  currentTime () {
    return 0;
  }

  setCurrentTime (position) {
    this.currentTime = position;
  }

  duration () {
    return 0;
  }

  volume () {
    return this.volume_;
  }

  /**
   * Request to enter fullscreen
   *
   * @method enterFullScreen
   */
  enterFullScreen () {
  }

  /**
   * Request to exit fullscreen
   *
   * @method exitFullScreen
   */
  exitFullScreen () {
  }


  setVolume (percentAsDecimal) {
    if (typeof(percentAsDecimal) !== 'undefined' && percentAsDecimal !== this.volume_) {
      this.volume_ = percentAsDecimal;
      this.trigger('volumechange');
    }
  }

  buffered () {
    return [];
  }

  controls () {
    return false;
  }

  muted () {
    return this.muted_;
  }

  setMuted (muted) {
    this.muted_ = muted;
  }

  supportsFullScreen () {
    return true;
  }


  resetSrc_ (callback) {
    callback();
  }

  dispose () {
    this.resetSrc_(Function.prototype);
    super.dispose(this);
  }

  onPlayerError (e) {
    this.errorNumber = e.data;
    this.trigger('error');
  }

  error () {
    return {code: 'External unknown error (' + this.errorNumber + ')'};
  }
}


Externals.prototype.className_ = ' vjs-externals';

Externals.prototype.options_ = {
  visibility: 'hidden'
};

Externals.prototype.apiReadyQueue = [];


/* Externals Support Testing -------------------------------------------------------- */

/*
 * Set the tech's volume control support status
 *
 * @type {Boolean}
 */
Externals.prototype['featuresVolumeControl'] = true;

/*
 * Set the tech's playbackRate support status
 *
 * @type {Boolean}
 */
Externals.prototype['featuresPlaybackRate'] = false;

/*
 * Set the tech's status on moving the video element.
 * In iOS, if you move a video element in the DOM, it breaks video playback.
 *
 * @type {Boolean}
 */
Externals.prototype['movingMediaElementInDOM'] = false;

/*
 * Set the the tech's fullscreen resize support status.
 * HTML video is able to automatically resize when going to fullscreen.
 * (No longer appears to be used. Can probably be removed.)
 */
Externals.prototype['featuresFullscreenResize'] = false;

/*
 * Set the tech's timeupdate event support status
 * (this disables the manual timeupdate events of the Tech)
 */
Externals.prototype['featuresTimeupdateEvents'] = false;

/*
 * Set the tech's progress event support status
 * (this disables the manual progress events of the Tech)
 */
Externals.prototype['featuresProgressEvents'] = false;

/*
 * Sets the tech's status on native text track support
 *
 * @type {Boolean}
 */
Externals.prototype['featuresNativeTextTracks'] = true;

/*
 * Sets the tech's status on native audio track support
 *
 * @type {Boolean}
 */
Externals.prototype['featuresNativeAudioTracks'] = true;

/*
 * Sets the tech's status on native video track support
 *
 * @type {Boolean}
 */
Externals.prototype['featuresNativeVideoTracks'] = false;

Externals.Events = 'apiready,ad_play,ad_start,ad_timeupdate,ad_pause,ad_end,video_start,' +
  'video_end,play,playing,pause,ended,canplay,canplaythrough,timeupdate,progress,seeking,' +
  'seeked,volumechange,durationchange,fullscreenchange,error'.split(',');

Component.registerComponent('Externals', Externals);

Tech.registerTech('Externals', Externals);


export default Externals;
