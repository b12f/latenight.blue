// Set app object
console.log("<3");



function App(){

    var app = this;
    app.player = {
        index: 0,
        originalPlaylist: undefined,
        shuffledPlaylist: undefined,
        playlist: function(){
          if(player.isShuffling){
            return player.shuffledPlaylist;
          }
          else {
            return player.originalPlaylist;
          }
        },
        YTPlayer: undefined,
        YTVideo: undefined,
        updateCallback: undefined,
        skipTimeout: undefined,
        isShuffling: false,
        episode: function(){
          return player.currentSong().episode;
        },
        convertTime: function(totalSeconds){
            var minutes = Math.floor(totalSeconds/60) + "";
            var seconds = Math.floor(totalSeconds - minutes * 60) + "";
            if(seconds.length < 2){
                seconds = "0" + seconds;
            }
            if(minutes.length < 2){
                minutes = "0" + minutes;
            }
            return minutes + ":" + seconds;
        },
        vidLength: function(){
            return player.convertTime(player.YTPlayer.getDuration());
        },
        currentTime: function(){
            return player.convertTime(player.YTPlayer.getCurrentTime());
        },
        updateTime: function(){
            $('#timeIndex').innerHTML = player.currentTime();
        },
        playing: function(){
            if(player.YTPlayer.getPlayerState()===1||player.YTPlayer.getPlayerState()===3){
                return true;
            }
            else{
                return false;
            }
        },
        init: function(){

            var videoId = player.getYTId(player.currentSong().url);

            function onPlayerReady(event){
                player.YTVideo = event.target;
                player.YTPlayer.setVolume(100);
                player.togglePlay();
            }

            function onPlayerStateChange(){
                var song = player.currentSong();
                $('#title').innerHTML = song.title;
                $('#episode').innerHTML = song.episode;
                $('#artist').innerHTML = song.artist;
                $('#album').innerHTML = song.album;
                $('#length').innerHTML = player.vidLength();
                $('#url').setAttribute("href", song.url);

                switch(player.YTPlayer.getPlayerState()){
                    case 3: // buffering
                        //$('#status').style.display = "block";
                        //$('#status').innerHTML = "Buffering...";
                    break;
                    case 0: // ended
                        //$('#status').style.display = "block";
                        //$('#status').innerHTML = "Loading...";
                        player.next();
                    break;
                    default: // playing
                        //$('#status').style.display = "none";
                        //$('#status').innerHTML = "";
                }
            }

            function onError(err){
              app.showError("An error occured. Skipping Track in 3 seconds...", 3000);
              $("#playpausebutton").setAttribute("class", "iconicstroke-play");
              clearInterval(player.updateCallback);
              player.skipTimeout = setTimeout(function(){
                player.next();
              }, 3000);
              console.log(err);
            }
            //Append div to replace
            var playerDiv = document.createElement('div');
            playerDiv.id = "player";
            $('#playerWrap').appendChild(playerDiv);

            // init player
            app.player.YTPlayer = new YT.Player('player', {
                height: '390',
                width: '640',
                videoId: videoId,
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    "onError": onError
                }
            });
        },
        togglePlay: function(){
            // Toggle play / pause
            if(player.playing()){
                player.YTVideo.pauseVideo();
                $("#playpausebutton").setAttribute("class", "iconicstroke-play");
                clearInterval(player.updateCallback);
            }
            else{
                player.YTVideo.playVideo();
                player.updateCallback = setInterval(function(){
                        player.updateTime();
                    }
                    , 990);
                $("#playpausebutton").setAttribute("class", "iconicstroke-pause");
            }
        },
        startPlayBack: function(addHistory){
          clearTimeout(player.skipTimeout);

          if(player.currentSong().deleted===true){
              app.showError("Episode not found. Skipping.")
              player.next();
          }
          else{
            player.YTPlayer.pauseVideo();
            player.YTPlayer.loadVideoById(player.getYTId(player.currentSong().url));
            player.updateCallback = setInterval(function(){
                    player.updateTime();
                }
                , 990);
            $("#playpausebutton").setAttribute("class", "iconicstroke-pause");
            if (addHistory) {
              app.addHistory();
            }
          }
        },
        next: function(){
            // Next song
            if(player.index===player.playlist().length - 1){
                app.updatePlaylist(function(){
                  player.index = 0;
                  player.startPlayBack(true);
                });
            }
            else{
                player.index++;
                player.startPlayBack(true);
            }
        },
        previous: function(){
            // Previous song
            if(player.index===0){
                player.index = player.playlist().length - 1;
            }
            else{
                player.index--;
            }
            player.startPlayBack(true);
        },
        goTo: function(index, addHistory){
            // Go to song
            if(typeof index === "number" && 0 <= index < player.playlist().length ){
              player.index = index;
              player.startPlayBack(addHistory);
            }
        },
        currentSong: function(){
            return player.playlist()[player.index];
        },
        getYTId: function(url){
            var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
            var match = url.match(regExp);
            if (match&&match[1].length==11){
                return match[1];
            }
            else {
                return false;
            };
        },
        togglePlayerShow: function(){
          var playerDiv = $("#player");
          if(app.getStyle(playerDiv,"display")==="none"){
            playerDiv.style.display = "block";
          }
          else{
            playerDiv.style.display = "none";
          }
        },
        indexInPlaylist: function(playlist){
          for(var i = 0; i < playlist.length; i++){
            if(playlist[i].episode===player.episode()){
              return i;
            }
          }
          return 0;
        },
        toggleShuffle: function(){
          var shuffleButton = $("#toggleShuffle");
          if(player.isShuffling){
            player.index = player.indexInPlaylist(player.originalPlaylist);
            app.removeClass(shuffleButton,"glow");
            player.isShuffling = false;
          }
          else {
            player.shuffle();
            player.index = 0;
            player.isShuffling = true;
            app.addClass(shuffleButton,"glow");
          }
        },
        shuffle: function(){
          player.shuffledPlaylist = JSON.parse(JSON.stringify(player.originalPlaylist));
          var counter = player.playlist().length - 1;
          var temp;
          var index;

          // While there are elements in the array
          while (counter > 0) {
              // Pick a random index
              index = Math.floor(Math.random() * counter);

              // Decrease counter by 1
              counter--;

              // And swap the last element with it
              temp = player.shuffledPlaylist[counter];
              player.shuffledPlaylist[counter] = player.shuffledPlaylist[index];
              player.shuffledPlaylist[index] = temp;
          }

          var indexOfCurrentSong = player.indexInPlaylist(player.shuffledPlaylist);
          var songToAdd = player.shuffledPlaylist.splice(indexOfCurrentSong, 1);
          player.shuffledPlaylist.unshift(songToAdd[0]);
        }
    }

    var player = app.player;

    app.updatePlaylist = function(cb){
        app.getJSON('playlist', function(data, errors){
            if(!errors){
                player.originalPlaylist = data;
                cb();
            }
            else{
                console.log(errors);
                app.showError("An error occurred updating the playlist.");
            }
        });
    }

    app.hideError = function(){
      $("#error").style.display = "none";
    }

    app.showError = function(message, time){
      $("#error").style.display = "block";
      if(typeof message === "string"){
        $("#error").innerHTML = message;
      }
      if(time!==false){
        if(time===undefined){
          time = 3000;
        }
        setTimeout(function(){
          app.hideError();
        }, time);
      }
    }

    app.showSuccess = function(message){
      $("#success").style.display = "block";
      if(typeof message === "string"){
        $("#success").innerHTML = message;
      }
      setTimeout(function(){
        $("#success").style.display = "none";
      }, 3000);
    }

    app.toggleFullscreen = function(){
      var fullscreenbutton = $("#toggleFullscreen").children[0];
      if (!document.fullscreenElement &&    // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
          } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
          }
          fullscreenbutton.className = "iconicstroke-fullscreen-exit";
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
          fullscreenbutton.className = "iconicstroke-fullscreen";
        }

    }

    app.addHistory = function(){
      history.pushState({index:player.index}, "episode "+player.episode() +" of latenight.blue", ""+player.episode());
      $("#pagetitle").innerHTML = "episode "+player.episode() +" of latenight.blue";
      ga('send', {
        'hitType': 'pageview',
        'page': '/'+player.episode(),
        'title': "episode "+player.episode() +" of latenight.blue"
      });
    }

    app.handlePopState = function(event){
      var episode = parseInt(window.location.pathname.substr(1));
      player.index = 0;
      if(!isNaN(episode) && typeof episode === "number" && 0 <= episode < player.playlist().length ){
        for(var i = 0; i < player.playlist().length; i++){
          if(player.playlist()[i].episode===episode){
            player.index = i;
            break;
          }
        }
      }

      if(player.YTPlayer!==undefined){
        player.goTo(player.index, false);
      }
    }

    app.onKeyDown = function(event){
      if(event.keyCode === 32){
        player.togglePlay();
      }
      else if(event.keyCode === 37){
        player.previous();
      }
      else if(event.keyCode === 39){
        player.next();
      }
    }

    app.init = function(){

      if($("#error").innerHTML !== ""){
        app.showError();
      }
        // Load playlist
        app.updatePlaylist(function() {

          app.handlePopState();

          window.onpopstate = app.handlePopState;

            // Create and init player
            app.player.init();

            //Bind events
            document.addEventListener("keydown", app.onKeyDown, false);

            var buttons = $("a");
            for(var i = 0; i < buttons.length; i++){
                buttons[i].onclick = function(event){
                    if(event.target.hasAttribute("data-action")){
                      var funcName = event.target.getAttribute("data-action");
                    }
                    else if(event.target.parentNode.hasAttribute("data-action")){
                      var funcName = event.target.parentNode.getAttribute("data-action");
                    }
                    else{
                      var funcName = event.path[1].getAttribute("data-action");
                    }

                    if(typeof player[funcName] === "function"){
                        player[funcName]();
                    }
                    else if(typeof app[funcName] === "function"){
                        app[funcName]();
                    }
                }
            }
        });
    }

    app.addClass = function(el, className){
        if (el.classList){
          el.classList.add(className);
        }
        else{
          el.className += ' ' + className;
        }
    }

    app.removeClass = function(el, className){
        if (el.classList){
          el.classList.remove(className);
        }
        else{
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    app.getStyle =  function(el,styleProp)
    {
      if (el.currentStyle){
        var y = el.currentStyle[styleProp];
      }
      else if (window.getComputedStyle){
        var y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
      }
      else{
        var y = undefined;
      }
      return y;
    }


    app.getJSON = function(url, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function() {
          if (this.status >= 200 && this.status < 400) {
            // Success!
            var data = JSON.parse(this.response);
            callback(data, false);
          } else {
            // We reached our target server, but it returned an error
            callback(false, "Server responded with an error.")
          }
        };
        request.onerror = function(e) {
          // There was a connection error of some sort
          callback(false, "An error occured fetching the playlist.")
        };
        request.send();
    }


};

var app;
function onYouTubeIframeAPIReady(){
    app = new App();
    window.onload = app.init();
}

function $(q){
  if(document.querySelector){
    if(q.substring(0,1)==="#"){
        return document.querySelector(q);
    }
    else{
        return document.querySelectorAll(q);
    }
  }
  else{
    if(q.substring(0,1)==="#"){
        return document.getElementById(q.substr(1));
    }
    else if(q.substring(0,1)==="."){
        return document.getElementsByClassName(q.substr(1));
    }
    else{
        return document.getElementsByTagName(q);
    }
  }
}
