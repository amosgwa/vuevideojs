videojs.options.techOrder = ["html5", "flash", "youtube"]

var videoController = Vue.extend({
  data() {
    return {
      scrub_position: "0",
      play_button_txt: "play",
      vc_currentTime_s: 0
    }
  },
  props: ['curr_idx', 'player', 'source', 'stats'],
  template: '#video-controller',
  ready() {
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
    },
    startSlider() {
      this.player.pause()
      // Removing listeners on every interaction.
      this.player.offListener('ended')
      this.player.offListener('timeupdate')
    },
    sliding(e) {
      this.player.updateCurrentTime(Math.round((e.target.value/100) * this.stats.totalDuration_s))
      //this.vc_currentTime_s = Math.round((e.target.value/100) * this.stats.totalDuration_s)
    },
    endSlider(e) {
      this.vc_currentTime_s = Math.round((e.target.value/100) * this.stats.totalDuration_s)
      var v = this.findIndex(this.vc_currentTime_s)
      this.player.play(v.idx, v.offset)
    },
    findIndex(time_s) {
      for(var i = 0; i < this.source.videos.length; i++) {
        var v = this.source.videos[i]
        if( time_s >= v.start && time_s <= v.end ) {
          return {"idx": i, "offset": time_s - v.start + (1 && (i != 0))}
        }
      }
      return {"idx": this.curr_idx, "offset": time_s - this.source.videos[this.curr_idx].start + (1 && (this.curr_idx != 0))}
    }
  },
  watch: {
    stats: {
      handler() {
        // Update the scrub bar value on stats change.
        this.scrub_position = Math.round(this.stats.currTime_s/this.stats.totalDuration_s * 100) + ""
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
        offListener: this.offListener,
        updateCurrentTime: this.updateCurrentTime_s
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
    this.videoPlayer = videojs("main-video")
  },
  methods: {
    play(idx, videoTime) {
      var self = this
      if (idx != undefined && videoTime != undefined) {
        this.currIndex = idx
        this.videoPlayer.pause()
        this.videoPlayer.src(this.source.videos[idx])
        this.videoPlayer.currentTime(videoTime)
      }
      // Listen on the time update.
      self.videoPlayer.on('timeupdate', function(){
        self.stats.currTime_s = this.currentTime() + self.source.videos[self.currIndex].start - (1 && (self.currIndex != 0))
        self.stats.currTime_m_s = videojs.formatTime(self.stats.currTime_s)
      })
      // Automatically play next on end.
      self.videoPlayer.on('ended', function(){
        self.currIndex += 1
        if(self.currIndex < self.source.videos.length){
          self.play(self.currIndex, 0)
        } else if(self.currIndex >= self.source.videos.length) {
          // Remove timeupdate listener to stop time update at end.
          self.offListener('timeupdate')
        }
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
    },
    updateCurrentTime_s(time) {
      this.stats.currTime_s = time
      this.stats.currTime_m_s = videojs.formatTime(this.stats.currTime_s)
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
  },
  methods: {
    calculateTimeRange() {
      var prev_duration = 0
      // Calculate the start and end of all the videos.
      for (var i = 0; i < this.source.videos.length; i++) {
        this.videosetting.totalDuration += this.source.videos[i].duration
        this.source.videos[i].start = prev_duration + (1 && (i != 0))
        this.source.videos[i].end = prev_duration + this.source.videos[i].duration
        prev_duration = this.videosetting.totalDuration
      }
    }
  },
  components: {
    'video-player': videoPlayer
  }
})