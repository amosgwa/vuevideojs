videojs.options.techOrder = ["html5", "flash", "youtube"]

var videoController = Vue.extend({
  data() {
    return {
      currentTime_m_s: "00:00",
      duration_m_s: "00:00",
      scrubPosition: "0",
      currentTime_s: 0,
      vid_idx: 0
    }
  },
  props: ['curr_idx', 'play_button'],
  template: '#video-controller',
  ready() {
    console.log('video controller ready', this.player)
  },
  methods: {
    //play: this.player.play
  }
})

var videoPlayer = Vue.extend({
  data() {
    return {
      currIndex: 0,
      play_button_text: "Play"
    }
  },
  props : ['source', 'vs', 'firstvideo'],
  template: `<video 
        muted
        controls
        id='{{source.id}}' 
        class='video-js vjs-big-play-centered' 
        width='{{vs.videoWidth}}'
        height='{{vs.videoHeight}}' 
        data-setup='{ }'>
          <source src='{{firstvideo.src}}' type='{{firstvideo.type}}'>
      </video>
      <video-controller :curr_idx='currIndex' :play_button='play_button_text'></video-player>
      `,
  beforeCompile() {
   
  },
  ready() {
    // Create a videojs instance
    console.log("id",this.source.id)
    this.videoPlayer = videojs("main-video")
    //this.play(0, 20)
  },
  methods : {
    play(idx, videoTime) {
      if(idx != undefined && videoTime != undefined){
        this.videoPlayer.pause()
        this.videoPlayer.src(this.source.videos[idx])
        this.videoPlayer.currentTime(videoTime)
      }
      this.videoPlayer.play()
      this.play_button_text = "Pause"
    },
    pause() {
      this.videoPlayer.pause()
    },
    playToggle() {
      if(this.currPlayer.paused()){
        this.currPlayer.play()
        this.play_button_text = "Pause"
      } else {
        this.currPlayer.pause()
        this.play_button_text = "Play"
      }   
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
    console.log(this.firstvideo)
  },
  methods: {
    calculateTimeRange() {
      var prev_duration = 0
      // Calculate the start and end of all the videos.
      for(var i = 0; i < this.source.videos.length; i++) {
        this.videosetting.totalDuration += this.source.videos[i].duration 
        this.source.videos[i].start = prev_duration + (1 && (i != 0))
        this.source.videos[i].end = prev_duration + this.source.videos[i].duration
        prev_duration = this.videosetting.totalDuration
      }
      console.log(this.source.videos)
    }
  },
  components: {
    'video-player': videoPlayer
  }
})