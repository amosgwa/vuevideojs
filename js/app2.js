videojs.options.techOrder = ["html5", "flash", "youtube"]

var videoController = Vue.extend({
  data() {
    return {
      scrub_position: "0",
      play_button_txt: "play",
      currentTime_s: 0,
    }
  },
  props: ['curr_idx', 'player', 'source', 'stats'],
  template: '#video-controller',
  ready() {
    console.log("ready controller")
  },
  methods: {
    togglePlay() {
      if (this.player.isPaused()) {
        this.player.play()
        this.play_button_txt = "Pause"
      } else {
        this.player.pause()
        this.play_button_txt = "Play"
      }
    },
    getVideoSrc() {
      return this.source.videos[this.curr_idx].src
    }
  },
  watch: {
    curr_idx() {
      // The video has ended, and src has changed to a new one.
      // Only play it if the curr_idx is less than the available sources.
      if(this.curr_idx < this.source.videos.length){
        console.log("source has changed", this.curr_idx)
        this.player.play(this.curr_idx, 0)
      } else {
        this.player.offListener('timeupdate')
      }
    },
    stats: {
      handler() {
        console.log("stat has changed")
        // Update the scrub bar value on stats change.
        this.scrub_position = this.stats.currTime_s/this.stats.totalDuration_s * 100 + ""
        console.log(this.scrub_position)
      },
      deep: true
    }
  }
})

var videoPlayer = Vue.extend({
  data() {
    return {
      currIndex: 0,
      player: {
        play: this.play,
        pause: this.pause,
        isPaused: this.isPaused,
        offListener: this.offListener
      },
      stats: {
        currTime_s: 0,
        currTime_m_s: "00:00",
        totalDuration_s: this.vs.totalDuration,
        totalDuration_m_s: videojs.formatTime(this.vs.totalDuration)
      },
      currTime : 0
    }
  },
  props: ['source', 'vs', 'firstvideo'],
  template: `<video 
        muted
        controls
        :id='source.id' 
        class='video-js vjs-big-play-centered' 
        :width='vs.videoWidth'
        :height='vs.videoHeight' 
        data-setup='{ }'>
          <source :src='firstvideo.src' :type='firstvideo.type'>
      </video>
      <video-controller :curr_idx='currIndex' :player='player' :source='source' :stats='stats'></video-player>
      `,
  beforeCompile() {

  },
  compiled(){

  },
  ready() {
    // Create a videojs instance
    //console.log("id",this.source.id)
    this.videoPlayer = videojs("main-video")
    console.log("ready player")
    this.play(0, 29)
  },
  methods: {
    play(idx, videoTime) {
      var self = this
      if (idx != undefined && videoTime != undefined) {
        this.videoPlayer.pause()
        this.videoPlayer.src(this.source.videos[idx])
        this.videoPlayer.currentTime(videoTime)
      }
      // Listen on the time update.
      self.videoPlayer.on('timeupdate', function(){
        self.stats.currTime_s = this.currentTime() + self.source.videos[self.currIndex].start
        self.stats.currTime_m_s = videojs.formatTime(self.stats.currTime_s)
      })
      // Automatically play next on end.
      self.videoPlayer.on('ended', function(){
        self.currIndex += 1
        // Remove the listener after each video has ended.
        self.offListener('ended')
      })
      this.videoPlayer.play()
    },
    pause() {
      this.videoPlayer.pause()
    },
    isPaused() {
      return this.videoPlayer.paused()
    },
    offListener(e){
      this.videoPlayer.off(e)
    }
  },
  components: {
    'video-controller': videoController
  }
})

new Vue({
  el: "#app2",
  data: {
    videosetting: {
      videoWidth: '350',
      videoHeight: '200',
      videoHeight: '200',
      totalDuration: 0
    },
    source: {
      id: 'main-video',
      poster: '',
      videos: [{
        src: 'https://www.youtube.com/watch?v=7CVtTOpgSyY',
        type: 'video/youtube',
        duration: 30
      }, {
        src: 'http://vjs.zencdn.net/v/oceans.mp4',
        type: 'video/mp4',
        duration: 46
      }, {
        src: 'https://www.youtube.com/watch?v=7CVtTOpgSyY',
        type: 'video/youtube',
        duration: 30
      }]
    },
    firstvideo: {}
  },
  beforeCompile() {
    // Generate start and end time for all videos.
    this.calculateTimeRange()
    // Set the first video.
    this.firstvideo = this.source.videos[0]
    //console.log(this.firstvideo)
  },
  methods: {
    calculateTimeRange() {
      var prev_duration = 0
      // Calculate the start and end of all the videos.
      for (var i = 0; i < this.source.videos.length; i++) {
        this.videosetting.totalDuration += this.source.videos[i].duration
        this.source.videos[i].start = prev_duration //+ (1 && (i != 0))
        this.source.videos[i].end = prev_duration + this.source.videos[i].duration
        prev_duration = this.videosetting.totalDuration
      }
    }
  },
  components: {
    'video-player': videoPlayer
  }
})