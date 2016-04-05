// Set app object
console.log("<3");



function App() {

    var app = this;
    app.player = {
        index: 0,
        volume: 100,
        originalPlaylist: undefined,
        shuffledPlaylist: undefined,
        playlist: function() {
            if (player.isShuffling) {
                return player.shuffledPlaylist;
            }
            else {
                return player.originalPlaylist;
            }
        },
        SCPlayer: undefined,
        YTPlayer: undefined,
        YTVideo: undefined,
        updateCallback: undefined,
        skipTimeout: undefined,
        isShuffling: false,
        episode: function() {
            return player.currentSong().episode;
        },
        convertTime: function(totalSeconds) {
            var minutes = Math.floor(totalSeconds/60) + "";
            var seconds = Math.floor(totalSeconds - minutes * 60) + "";
            if (seconds.length < 2) {
                seconds = "0" + seconds;
            }
            if (minutes.length < 2) {
                minutes = "0" + minutes;
            }
            return minutes + ":" + seconds;
        },
        vidLength: function(cb) {
            switch (player.getHost(player.currentSong().url)) {
                case 'youtube':
                    cb(player.convertTime(player.YTPlayer.getDuration()));
                    break;
                case 'soundcloud':
                    player.SCPlayer.getDuration(function (duration) {
                        cb(player.convertTime(duration/1000));
                    });
                    break;
            }
        },
        currentTime: function(cb) {
            switch (player.getHost(player.currentSong().url)) {
                case 'youtube':
                    cb(player.convertTime(player.YTPlayer.getCurrentTime()));
                    break;
                case 'soundcloud':
                    player.SCPlayer.getPosition(function (position) {
                        cb(player.convertTime(position/1000));
                    });
                    break;
            }
        },
        updateTime: function() {
            player.currentTime(function (time) {
                $('#timeIndex').innerHTML = time;
            });
        },
        playing: function(cb) {
            switch (player.getHost(player.currentSong().url)) {
                case 'youtube':
                    cb(player.YTPlayer.getPlayerState()===1||player.YTPlayer.getPlayerState()===3);
                    break;
                case 'soundcloud':
                    player.SCPlayer.isPaused(function(isPaused) {
                        cb(!isPaused);
                    });
                    break;
            }
        },
        init: function() {
            $('body')[0].setAttribute('class', 'ep'+player.episode());

            switch (player.getHost(player.currentSong().url)) {
                case 'youtube':
                    var YTvideoId = player.getYTId(player.currentSong().url);
                    var i = 0;
                    var SCsoundUrl;
                    do {
                        SCsoundUrl = player.playlist()[i].url;
                        i++;
                    } while(player.getHost(SCsoundUrl) !== 'soundcloud' && i < player.playlist().length);
                    break;
                case 'soundcloud':
                    var SCsoundUrl = player.currentSong().url;
                    var i = 0;
                    do {
                        var YTvideoId = player.getYTId(player.playlist()[i].url);
                        i++;
                    } while(YTvideoId === false && i < player.playlist().length);
                    break;
                default:
                    player.next();
            }

            function onPlayerStateChange() {
                var song = player.currentSong();
                $('#title').innerHTML = song.title;
                $('#episode').innerHTML = song.episode;
                $('#artist').innerHTML = song.artist;
                $('#album').innerHTML = song.album;
                player.vidLength(function (duration) {
                    $('#length').innerHTML = duration;
                });
                $('#url').setAttribute("href", song.url);

                if (player.getHost(song.url) === 'youtube' && player.YTPlayer.getPlayerState() === 0) {
                    player.next();
                }
            }

            function onError(err) {
                app.showError("An error occured. Skipping Track in 3 seconds...", 3000);
                $("#playpausebutton").setAttribute("class", "iconicstroke-play");
                clearInterval(player.updateCallback);
                player.skipTimeout = setTimeout(function() {
                    player.next();
                }, 3000);
                console.log(err);
            }

            if (YTvideoId !== false) {
                //Append div to replace
                var YTplayerDiv = document.createElement('div');
                YTplayerDiv.id = 'YTplayer';
                YTplayerDiv.className = 'player';
                $('#playerWrap').appendChild(YTplayerDiv);

                // init player
                app.player.YTPlayer = new YT.Player('YTplayer', {
                    height: '390',
                    width: '640',
                    videoId: YTvideoId,
                    events: {
                        'onReady': function onYTPlayerReady(event) {
                            player.YTVideo = event.target;
                            player.YTPlayer.unMute();
                            player.YTPlayer.setVolume(player.volume);
                            player.play();
                        },
                        'onStateChange': onPlayerStateChange,
                        "onError": onError
                    }
                });
            }

            if (player.getHost(SCsoundUrl) === 'soundcloud') {
                var SCplayerDiv = document.createElement('iframe');
                SCplayerDiv.id = 'SCplayer';
                SCplayerDiv.className = 'player';

                player.getSCId(SCsoundUrl, function(scApiData, error) {
                    if (error) {
                        app.showError("An error occurred contacting the Soundcloud API.");
                        console.log(error);
                        player.next();
                        return;
                    }

                    SCplayerDiv.setAttribute('src', 'https://w.soundcloud.com/player/?url='+ encodeURIComponent(scApiData.uri) +'&amp;auto_play=false&amp;hide_related=true&amp;show_comments=true&amp;show_user=false&amp;show_reposts=false&amp;visual=true')
                    $('#playerWrap').appendChild(SCplayerDiv);

                    app.player.SCPlayer = SC.Widget('SCplayer');
                    app.player.SCPlayer.setVolume(player.volume);
                    app.player.SCPlayer.bind(SC.Widget.Events.READY, function onSCPlayerReady () {
                        player.play();
                    });
                    app.player.SCPlayer.bind(SC.Widget.Events.ERROR, onError);
                    app.player.SCPlayer.bind(SC.Widget.Events.PLAY, onPlayerStateChange);
                    app.player.SCPlayer.bind(SC.Widget.Events.FINISH, player.next);
                });
            }
        },
        play: function() {
            switch (player.getHost(player.currentSong().url)) {
                case 'youtube':
                    player.YTVideo.playVideo();
                    app.addClass($('#YTplayer'), 'currentPlayer');
                    break;
                case 'soundcloud':
                    player.SCPlayer.play();
                    app.addClass($('#SCplayer'), 'currentPlayer');
                    break;
            }
            player.updateCallback = setInterval(function() {
                    player.updateTime();
                }
                , 1000);
            $("#playpausebutton").setAttribute("class", "iconicstroke-pause");
        },
        pause: function() {
            if (player.YTVideo) {player.YTVideo.pauseVideo();}
            if (player.SCPlayer) {player.SCPlayer.pause();}

            $("#playpausebutton").setAttribute("class", "iconicstroke-play");
            clearInterval(player.updateCallback);
        },
        togglePlay: function() {
            // Toggle play / pause
            player.playing(function(isPlaying) {
                if (isPlaying) {
                    player.pause();
                }
                else {
                    player.play();
                }
            });
        },
        startPlayBack: function(addHistory) {
            clearTimeout(player.skipTimeout);

            if (player.currentSong().deleted===true) {
                app.showError("Episode not found. Skipping.");
                player.next();
            }
            else {
                app.removeClass($('.currentPlayer')[0], 'currentPlayer');
                player.pause();

                switch (player.getHost(player.currentSong().url)) {
                    case 'youtube':
                        player.YTPlayer.loadVideoById(player.getYTId(player.currentSong().url));
                        player.play();
                        break;
                    case 'soundcloud':
                        player.getSCId(player.currentSong().url, function (scApiData, error) {
                            if (error) {
                                app.showError("An error occurred contacting the Soundcloud API.");
                                console.log(error);
                                player.next();
                                return;
                            }
                            player.SCPlayer.load(scApiData.uri);
                            player.SCPlayer.bind(SC.Widget.Events.READY, function onSCPlayerReady () {
                                player.SCPlayer.setVolume(player.volume/100);
                                player.play();
                            });
                        });
                        break;
                    default:
                        app.showError('An error occurred. Skipping.');
                        player.next();
                        break;
                }
                $('body')[0].setAttribute('class', 'ep'+player.episode());
                player.updateCallback = setInterval(function() {
                        player.updateTime();
                    }
                    , 1000);
                $("#playpausebutton").setAttribute("class", "iconicstroke-pause");
                if (addHistory) {
                    app.addHistory();
                }
            }
        },
        next: function() {
            // Next song
            if (player.index===player.playlist().length - 1) {
                app.updatePlaylist(function() {
                    player.index = 0;
                    player.startPlayBack(true);
                });
            }
            else {
                player.index++;
                player.startPlayBack(true);
            }
        },
        previous: function() {
            // Previous song
            if (player.index===0) {
                player.index = player.playlist().length - 1;
            }
            else {
                player.index--;
            }
            player.startPlayBack(true);
        },
        goTo: function(index, addHistory) {
            // Go to song
            if (typeof index === "number" && 0 <= index < player.playlist().length ) {
                player.index = index;
                player.startPlayBack(addHistory);
            }
        },
        currentSong: function() {
            return player.playlist()[player.index];
        },
        getHost: function(url) {
            if (url.indexOf('youtube.com/') > -1 || url.indexOf('youtu.be/') > -1) {
                return 'youtube';
            } else if (url.indexOf('soundcloud.com/') > -1) {
                return 'soundcloud';
            } else {
                return false;
            }
        },
        getSCId: function(url, cb) {
            app.getJSON('https://api.soundcloud.com/resolve.json?url='+ encodeURIComponent(url) +'&client_id=' + scApiId, cb);
        },
        getYTId: function(url) {
            var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
            var match = url.match(regExp);
            if (match&&match[1].length==11) {
                return match[1];
            }
            else {
                return false;
            };
        },
        togglePlayerShow: function() {
            var playerDiv = $("#playerWrap");
            app.toggleClass(playerDiv, 'showPlayer');
        },
        toggleInfoShow: function() {
            var aboutDiv = $("#about");
            if (app.getStyle(aboutDiv,"display")==="none") {
                aboutDiv.style.display = "block";
            }
            else {
                aboutDiv.style.display = "none";
            }
        },
        indexInPlaylist: function(playlist) {
            for(var i = 0; i < playlist.length; i++) {
                if (playlist[i].episode===player.episode()) {
                    return i;
                }
            }
            return 0;
        },
        toggleShuffle: function() {
            var shuffleButton = $("#toggleShuffle");
            if (player.isShuffling) {
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
        toggleVolume: function() {
            var volumeButton = $("#toggleVolume");
            if (player.YTPlayer.isMuted()) {
                player.YTPlayer.unMute();
                $("#volume").style.width = player.YTPlayer.getVolume()+"%";
                app.removeClass(volumeButton,"iconicstroke-volume-mute");
                app.addClass(volumeButton,"iconicstroke-volume");
            }
            else {
                player.YTPlayer.mute();
                $("#volume").style.width = "0%";
                app.removeClass(volumeButton,"iconicstroke-volume");
                app.addClass(volumeButton,"iconicstroke-volume-mute");
            }
            player.SCPlayer.toggle();
        },
        setVolume: function(event) {
            player.volume = Math.ceil(event.offsetX/50 * 100);
            $("#volume").style.width = player.volume+"%";
            player.YTPlayer.setVolume(player.volume);
            player.SCPlayer.setVolume(player.volume/100);
        },
        shuffle: function() {
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
    };

    var player = app.player;

    app.updatePlaylist = function(cb) {
        app.getJSON('playlist', function(data, errors) {
            if (!errors) {
                player.originalPlaylist = data;
                cb();
            }
            else {
                console.log(errors);
                app.showError("An error occurred updating the playlist.");
            }
        });
    };

    app.hideError = function() {
        $("#error").style.display = "none";
    };

    app.showError = function(message, time) {
        $("#error").style.display = "block";
        if (typeof message === "string") {
            $("#error").innerHTML = message;
        }
        if (time!==false) {
            if (time===undefined) {
                time = 3000;
            }
            setTimeout(function() {
                app.hideError();
            }, time);
        }
    };

    app.showSuccess = function(message) {
        $("#success").style.display = "block";
        if (typeof message === "string") {
            $("#success").innerHTML = message;
        }
        setTimeout(function() {
            $("#success").style.display = "none";
        }, 3000);
    };

    app.toggleFullscreen = function() {
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

    };

    app.addHistory = function() {
        history.replaceState({index:player.index}, "Episode "+player.episode() +" of latenight.blue", ""+player.episode());
        $("#pagetitle").innerHTML = "Episode "+player.episode() +" of latenight.blue";
        ga('send', {
            'hitType': 'pageview',
            'page': '/'+player.episode(),
            'title': "Episode "+player.episode() +" of latenight.blue"
        });
    };

    app.handlePopState = function(event) {
        var episode = parseInt(window.location.pathname.substr(1));

        player.index = 0;
        if (!isNaN(episode) && typeof episode === "number" && 0 <= episode < player.playlist().length ) {
            for (var i = 0; i < player.playlist().length; i++) {
                if (player.playlist()[i].episode === episode) {
                    player.index = i;
                    break;
                }
            }
        }

        if (player.YTPlayer!==undefined || player.SCPlayer!==undefined) {
            player.goTo(player.index, false);
        }
    };

    app.onKeyDown = function(event) {
        if (event.keyCode === 32) { // spacebar
            player.togglePlay();
        }
        else if (event.keyCode === 37) { // left arrow
            player.previous();
        }
        else if (event.keyCode === 39) { // right arrow
            player.next();
        }
        else if (event.keyCode === 70) { // f
            app.toggleFullscreen();
        }
        else if (event.keyCode === 77) { // m
            player.toggleVolume();
        }
        else if (event.keyCode === 73) { // i
            player.toggleInfoShow();
        }
        else if (event.keyCode === 86) { // v
            player.togglePlayerShow();
        }
    };

    app.init = function() {

    if ($("#error").innerHTML !== "") {
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
        for(var i = 0; i < buttons.length; i++) {
            buttons[i].onclick = function(event) {
                if (event.target.hasAttribute("data-action")) {
                    var funcName = event.target.getAttribute("data-action");
                }
                else if (event.target.parentNode.hasAttribute("data-action")) {
                    var funcName = event.target.parentNode.getAttribute("data-action");
                }
                else {
                    var funcName = event.path[1].getAttribute("data-action");
                }

                if (typeof player[funcName] === "function") {
                    player[funcName](event);
                }
                else if (typeof app[funcName] === "function") {
                    app[funcName](event);
                }
            }
        }
    });
};

app.addClass = function(el, className) {
    if (!el) {return;}
    if (el.classList) {
        el.classList.add(className);
    }
    else {
        el.className += ' ' + className;
    }
};

app.removeClass = function(el, className) {
    if (!el) {return;}
    if (el.classList) {
        el.classList.remove(className);
    }
    else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
};

app.hasClass = function(el, className) {
    if (!el) {return;}
    className = " " + className + " ";
    return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(className) > -1;
};

app.toggleClass = function(el, className) {
    if (!el) {return;}
    if (el.classList) {
        el.classList.toggle(className);
    }
    else {
        if (app.hasClass(el, className)) {
            app.removeClass(el, className);
        } else {
            app.addClass(el, className);
        }
    }
};

app.getStyle =  function(el,styleProp) {
    if (!el) {return;}
    if (el.currentStyle) {
        var y = el.currentStyle[styleProp];
    }
    else if (window.getComputedStyle) {
        var y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
    }
    else {
        var y = undefined;
    }
    return y;
};


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


}

var app;
function onYouTubeIframeAPIReady() {
    app = new App();
    window.onload = app.init();
}

function $(q) {
    if (document.querySelector) {
        if (q.substring(0,1)==="#") {
            return document.querySelector(q);
        }
        else {
            return document.querySelectorAll(q);
        }
    }
    else {
        if (q.substring(0,1)==="#") {
            return document.getElementById(q.substr(1));
        }
        else if (q.substring(0,1)===".") {
            return document.getElementsByClassName(q.substr(1));
        }
        else {
            return document.getElementsByTagName(q);
        }
    }
}
