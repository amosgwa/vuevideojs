// Set global option for videojs.
// videojs.options.autoplay = true
videojs.options.techOrder = ["html5", "flash", "youtube"]

var videoController = Vue.extend({
  data () {
    return {
      currentTime_m_s: "00:00",
      duration_m_s: "00:00",
      scrubPosition: "0",
      playToggle: "Play",
      currentTime_s: 0,
      vidIndex: 0
    }
  }, 
  props: ['video_duration', 'source', 'vid_index', 'change_idx'],
  template: "#video-controller",
  beforeCompile () {
    this.duration_m_s = videojs.formatTime(parseInt(this.video_duration))
  },
  ready () {
    var self = this
    // Attach the currplayer to this component.
    console.log("index", this.vid_index)
    this.currPlayer = videojs(this.source.id)
    // Add listeners
    this.currPlayer.on('timeupdate', function(){
      self.currTime_s = self.source.videos[self.vid_index - 1].start + self.currPlayer.currentTime()
      self.updateTime()
      self.updateScrubBar()
    })
    console.log(this.source)
    // Update the currentTime and fullLength
    this.updateTime()
  },
  methods: {
    togglePlay (e) {
      if(this.currPlayer.paused()){
        this.currPlayer.play()
        this.playToggle = "Pause"
      } else {
        this.currPlayer.pause()
        this.playToggle = "Play"
      }   
      
      this.updateTime ()
    },
    startSlider (e) {
      console.log("mouse entered")
      this.isInteracting = true
      this.currPlayer.pause()
      this.playToggle = "Play"
    },
    moveSlider (e) {
      //this.currentTime_num = (e.target.value/100) * this.video_duration
      //this.currPlayer.currentTime((e.target.value/100) * this.video_duration )
      
      //var sliderTime_second = (e.target.value/100) * this.video_duration
      //this.switchSrc(this.getSrc(sliderTime_second))  
      this.updateTime ()
    },
    stopSlider (e) {
      var sliderTime_second = (e.target.value/100) * this.video_duration
      this.switchSrc(this.getSrc(sliderTime_second))      
      //this.currPlayer.currentTime((e.target.value/100) * this.video_duration )
      //this.currPlayer.play()      
      this.playToggle = "Pause"
      console.log("mouse released")
      this.isInteracting = false
    },
    updateTime () {
//    self.currentTime_num = this.currPlayer.currentTime()
      //this.currentTime_m_s = videojs.formatTime(this.source.videos[this.vid_index - 1].start + this.currPlayer.currentTime())
      this.currentTime_m_s = videojs.formatTime(this.currTime_s)
    },
    updateScrubBar () {
      //console.log(this.source.videos[this.currVideo_idx].start + this.currPlayer.currentTime())
      if(!this.isInteracting) {
        this.scrubPosition = (this.currTime_s / parseInt(this.video_duration)) * 100 + "" // Convert to string, number doens't work for 0.
      }      
      //console.log("scrub pos", this.scrubPosition)
    },
    getSrc (time) {
      // Try to find the current video based on the location of the scrub bar time.
      console.log("time", time)
      for(var i = 0; i < this.source.videos.length; i++) {
        var v = this.source.videos[i]
        console.log("v",v)
        if( time >= v.start && time < v.end ) {
          console.log({src : v, currTime : time - v.start, idx : i})
          return {src : v, currTime : time - v.start, idx : i}
        }
      }
      console.log({src : this.currPlayer.currentSrc(), currTime : this.currPlayer.currentTime(), idx : this.vid_index - 1})
      return {src : this.currPlayer.currentSrc(), currTime : this.currPlayer.currentTime(), idx : this.vid_index - 1}
    },
    switchSrc (v) {
      console.log("v", v)
      this.currPlayer.pause()
      this.currPlayer.src(v.src)
      this.currPlayer.currentTime(v.currTime)
      this.currPlayer.play()
      
      this.vid_index = v.idx
      
      // Also change the parent's current index.
      this.change_idx(this.vid_index+1)

      console.log("Set Curent time", v.currTime)
      console.log("Video Curent time", this.currPlayer.currentTime())
      
      this.updateScrubBar ()
    }
  }
})

var videoPlayer = Vue.extend({
  data () {
    return {
      // currPlayer: {}, //This causes error because it doesn't allow to redefine some of the properties.
      // Object.defineProperty isn't configurable unless specified.
      msgPlayer: "Hello from videoplayer",
      duration: 0, // 30 seconds youtube + 1800 seconds hls
      playerTemplate: "",
      currVideo_idx: 1,
      currSrc: {}
    }
  },
  props: ['source', 'vs'],
  template: "{{{playerTemplate}}} <video-controller :video_duration='duration' :source='source' :vid_index='currVideo_idx' :change_idx='setCurrVideo_idx'></video-player>",
  beforeCompile () {
    // Calculate the totalDuration of all the videos.
    var prev_duration = 0
    // Calculate the start and end of all the videos.
    for(var i = 0; i < this.source.videos.length; i++) {
      this.duration += this.source.videos[i].duration 
      this.source.videos[i].start = prev_duration + 1
      this.source.videos[i].end = prev_duration + this.source.videos[i].duration
      prev_duration = this.duration
    }
    
    // Generate the template with the first video.    
    var currVideo = this.source.videos[0];
    console.log("initial index changed", 0);
    // Parse the Videoplayer using ES6 Template literals.
    this.playerTemplate = 
      `<video 
        muted
        id='${this.source.id}' 
        class='video-js vjs-big-play-centered' 
        width='${this.vs.videoWidth}'
        height='${this.vs.videoHeight}' 
        data-setup='{ }'>
          <source src='${currVideo.src}' type='${currVideo.type}'>
      </video>`
  },
  ready () {
    // Attach an instance of the video player to the Vue when the component is ready.
    this.currPlayer = videojs(this.source.id)
    // Play recursively to the next video.
    this.playNextVideo()
  },
  methods: {
    playNextVideo () {       
      // Only attach next video when available.
      // console.log("\n\nAttempting to attach next video")
      // console.log("Remaining Video", this.source.videos)
      
      if (this.currVideo_idx < this.source.videos.length) {
      //  var nextVideo = this.source.videos[this.currVideo_idx]        
        var self = this;
        console.log("Attaching to current", this.currPlayer.currentSrc())
        this.currPlayer.on('ended', function() {
          //console.log("Next video", nextVideo.src)
          // Vue component listens to the source change.
          console.log("Adding index",self.currVideo_idx)
          self.currSrc = self.source.videos[self.currVideo_idx]  
          self.currVideo_idx += 1;            
          self.currPlayer.off('ended')
        })
      } else {
        // The end of the loop.
        // this.currPlayer.pause()
        console.log("Finished",this.currVideo_idx);
      }
    },
    setCurrVideo_idx (idx) {
      this.currVideo_idx = idx
    }
  },
  watch: {
    currSrc () {
      // Source is changed to a new one.
      // Reset the player with new source.
      console.log("Source changed", this.currSrc)
      
      if (this.currSrc) {
        this.currPlayer.src(this.currSrc)
        this.currPlayer.load()
        this.currPlayer.play()        
        // Try to play next video.
        this.playNextVideo()
      }
    },
    currVideo_idx () {
      console.log("Video index changed", this.currVideo_idx)
    }
  },
  components: {
    'video-controller': videoController
  }
})

//Vue.component('video-player', videoPlayer)

new Vue({
  el: '#app',
  data: {
    msg: 'Hello Vue.js!',
    videosetting: {
      videoWidth: '350',
      videoHeight: '200'
    },
    source: {
      id: 'main-video',
      poster: '',
      videos: [
      {
        src: 'https://www.youtube.com/watch?v=7CVtTOpgSyY',
        type: 'video/youtube',
        duration: 30
      },{
        src: 'http://vjs.zencdn.net/v/oceans.mp4',
        type: 'video/mp4',
        duration: 46
      },{
        src: 'https://www.youtube.com/watch?v=7CVtTOpgSyY',
        type: 'video/youtube',
        duration: 30
      }]
    }
  },
  components: {
    'video-player': videoPlayer
  }
})

// ,{
//         src: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8',
//         type: 'application/x-mpegURL',
//         duration: 1800
//       }