// Set app object
console.log("<3");



function App() {

    var app = this;
    app.player = {
        index: 0,
        volume: 100,
        muted: false,
        likedList: [],
        originalPlaylist: undefined,
        currentPlaylist: undefined,

        /*
         * Returns the currently used playlist
         */
        playlist: function() {
            return player.currentPlaylist;
        },
        SCPlayer: undefined,
        YTPlayer: undefined,
        YTVideo: undefined,
        updateCallback: undefined,
        skipTimeout: undefined,
        isShuffling: false,
        playingLikes: false,

        /*
         * Returns the episode number of the current episode
         */
        episode: function() {
            return player.currentSong().episode;
        },

        /*
         * returns the current song object
         */
        currentSong: function() {
            return player.playlist()[player.index];
        },

        /*
         * Converts seconds into mm:ss format
         */
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

        /*
         * Retrieves the length of the current song in seconds.
         *
         * Accepts a callback which will receive the length in seconds
         */
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

        /*
         * Gets the current time index
         *
         * Accepts a callback which will receive the time index in seconds
         */
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

        /*
         * Updates the time shown on the player
         */
        updateTime: function() {
            player.currentTime(function (time) {
                $('#timeIndex').innerHTML = time;
            });
        },

        /*
         * Returns whether the player is playing or not
         *
         * Accepts a callback which will receive a boolean
         */
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
                default:
                    cb(false);
            }
        },

        /*
         * Init function of the player.
         *
         * Loads the external players and inits them with a song. Initializes statechange and errorhandling functions
         * for the players.
         */
        init: function() {
            $('body')[0].setAttribute('class', 'ep'+player.episode());

            try {
                var lp = localStorage.getItem('likedList');
                if (lp) {
                    this.likedList = JSON.parse(lp);
                }
            } catch(e) {
                this.likedList = [];
            }

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
                player.drawPlaylistCurrentItem();
                player.vidLength(function (duration) {
                    $('#length').innerHTML = duration;
                });
                $('#url').setAttribute("href", song.url);

                if (player.isLiked(song.episode)) {
                    $("#toggleLike").setAttribute("class", "iconicfill-heart-fill");
                } else {
                    $("#toggleLike").setAttribute("class", "iconicstroke-heart-stroke");
                }

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
                console.log('A playback error occured:', err);
            }

            if (YTvideoId !== false) {
                //Append div to replace
                var YTplayerDiv = document.createElement('div');
                YTplayerDiv.id = 'YTplayer';
                YTplayerDiv.className = 'player';
                $('#extPlayerWrap').appendChild(YTplayerDiv);

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
                    $('#extPlayerWrap').appendChild(SCplayerDiv);

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

        /*
         * Unpauses
         */
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

        /*
         * Pauses
         */
        pause: function() {
            if (player.YTVideo) {player.YTVideo.pauseVideo();}
            if (player.SCPlayer) {player.SCPlayer.pause();}

            $("#playpausebutton").setAttribute("class", "iconicstroke-play");
            clearInterval(player.updateCallback);
        },

        /*
         * Toggles play/pause
         */
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

        /*
         * Starts playback of a new song
         *
         * Accepts a boolean addHistory to specify whether a new html5 history entry should be made.
         */
        startPlayBack: function(addHistory) {
            clearTimeout(player.skipTimeout);

            app.removeClass($('.currentPlayer')[0], 'currentPlayer');
            player.pause();

            if (player.playingLikes && !player.isLiked(player.episode())) {
                player.next();
                return;
            }

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
                            if (player.isMuted) {player.SCPlayer.setVolume(0);}
                            player.play();
                        });
                    });
                    break;
                default:
                    app.showError('An error occurred. Skipping.');
                    player.next();
                    return;
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
        },

        /*
         * Skips to the next song in the current playlist
         */
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

        /*
         * Skips to the previous song in the current playlist
         */
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

        /*
         * Goes to a specific song
         *
         * Accepts an int index which specifies the index in the current playlist to skip to
         * Accepts a boolean addHistory to specify whether a new html5 history entry should be made.
         */
        goTo: function(index, addHistory) {
            var player = this;
            // Go to song
            if (typeof(index) === "number" && -1 < index && index < player.playlist().length ) {
                player.index = index;
                player.startPlayBack(addHistory);
            }
        },

        /*
         * returns the host of the url ('youtube', 'soundcloud') or false if none found
         *
         * Accepts a string url of the song
         */
        getHost: function(url) {
            if (url.indexOf('youtube.com/') > -1 || url.indexOf('youtu.be/') > -1) {
                return 'youtube';
            } else if (url.indexOf('soundcloud.com/') > -1) {
                return 'soundcloud';
            } else {
                return false;
            }
        },

        /*
         * Asynchronously returns the API data of a soundcloud sound
         *
         * Accepts a string url which specifies the url of the soundcloud song
         * Accepts a function callback which will receive a scApiData and error object.
         */
        getSCId: function(url, cb) {
            app.getJSON('https://api.soundcloud.com/resolve.json?url='+ encodeURIComponent(url) +'&client_id=' + scApiId, cb);
        },

        /*
         * Returns the ID of a youtube video or false if none found
         *
         * Accepts a string url of YT video
         */
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

        /*
         * Toggles whether the external player is shown
         */
        togglePlayerShow: function() {
            var playerDiv = $("#extPlayerWrap");
            app.toggleClass(playerDiv, 'showPlayer');
        },

        /*
         * Toggles whether the information text is shown
         */
        toggleInfoShow: function() {
            var aboutDiv = $("#about");
            if (app.getStyle(aboutDiv,"display")==="none") {
                aboutDiv.style.display = "block";
            }
            else {
                aboutDiv.style.display = "none";
            }
        },

        /*
         * Toggles like status of [current] song
         *
         * Accepts optional number episode
         */
        toggleLike: function(ep) {
            if (!ep || typeof(ep) !== "number") {
                ep = player.currentSong().episode;
            }

            var likeIcon = $("#toggleLike");

            if (player.isLiked(ep)) {
                likeIcon.setAttribute('class', 'iconicstroke-heart-stroke');
                player.likedList.splice(player.likedList.indexOf(ep), 1);
            }
            else {
                likeIcon.setAttribute('class', 'iconicfill-heart-fill');
                player.likedList.push(ep);
            }

            localStorage.setItem('likedList', JSON.stringify(player.likedList));

            player.drawPlaylist();
        },

        /*
         * Toggles whether liked or all songs are playing
         */
        toggleLikedOnly: function() {
            player.playingLikes = !player.playingLikes;
            player.drawPlaylist();
            var indicator = $('#toggleLikedOnly');
            if (player.playingLikes) {
                indicator.setAttribute('class', 'iconicfill-heart-fill');
            } else {
                indicator.setAttribute('class', 'iconicstroke-heart-stroke');
            }
        },

        /*
         * Checks whether a song is liked
         *
         * Accepts optional number episode
         *
         * returns boolean isLiked
         */
        isLiked: function(ep) {
            return player.likedList.indexOf(ep) > -1;
        },

        /*
         * Returns which index the current song has in a playlist or -1 if none found
         *
         * Accepts an array playlist and optional number episode
         *
         * returns number index
         */
        indexInPlaylist: function(playlist, episode) {
            if (episode === undefined) {
                episode = player.episode();
            }

            for(var i = 0; i < playlist.length; i++) {
                if (playlist[i].episode === episode) {
                    return i;
                }
            }
            return -1;
        },

        /*
         * Toggles display of playlist
         */
        togglePlaylistShow: function() {
            var playlistWrap = $("#playlistWrap");
            if (app.getStyle(playlistWrap,"display")==="none") {
                playlistWrap.style.display = "block";
            }
            else {
                playlistWrap.style.display = "none";
            }
        },

        /*
         * Sets the current playlist
         *
         * Accepts array playlist
         */
        setCurrentPlaylist: function(data) {
            player.currentPlaylist = JSON.parse(JSON.stringify(data));
            player.drawPlaylist();
        },

        /*
         * Draws the html of the playlist view
         */
        drawPlaylist: function() {
            setTimeout(function() {

                var playlistDiv = $('#playlist');

                playlistDiv.innerHTML = '';

                for (var i = 0; i < player.playlist().length; i++) {
                    var song = player.playlist()[i];

                    if (player.playingLikes && !player.isLiked(song.episode)) {
                        continue;
                    }

                    var html = '<div ' +
                        'id="ep' + song.episode + '" ' +
                        'class="entry">' +
                        '<div class="episode">' +
                        song.episode +
                        '</div>' +
                        '<a ' +
                        'class="like"'+
                        'href="javascript:void(0)" ' +
                        'data-episode="' + song.episode + '">' +
                        '<span class="';
                    if (player.isLiked(song.episode)) {
                        html += 'iconicfill-heart-fill'
                    } else {
                        html += 'iconicstroke-heart-stroke';
                    }
                    html += '"></span></a>&nbsp;&nbsp;' +
                        '<a ' +
                        'class="song"'+
                        'href="javascript:void(0)" ' +
                        'data-episode="' + song.episode + '">' +
                        song.artist +
                        ' - ' +
                        song.title +
                        '</a>' +
                        '</div>';
                    playlistDiv.innerHTML = playlistDiv.innerHTML + html;
                }

                var buttons = $("a.song");
                for(var i = 0; i < buttons.length; i++) {
                    buttons[i].addEventListener('click', function(event) {
                        if (event.target.hasAttribute("data-episode")) {
                            var episode = parseInt(event.target.getAttribute("data-episode"));
                            player.goTo(player.indexInPlaylist(player.playlist(), episode));
                        }
                    });
                }

                buttons = $("a.like");
                for(i = 0; i < buttons.length; i++) {
                    buttons[i].addEventListener('click', function(event) {
                        if (event.target.hasAttribute("data-episode")) {
                            var episode = parseInt(event.target.getAttribute("data-episode"));
                        } else {
                            var episode = parseInt(event.target.parentElement.getAttribute("data-episode"));
                        }


                        player.toggleLike(episode);
                    });
                }

                player.drawPlaylistCurrentItem();
            }, 0);
        },

        /*
         * Bolds the current song in the playlist view
         */
        drawPlaylistCurrentItem: function () {
            var curEls = $('.entry.current');
            for (var i = 0; i < curEls.length; i++) {
                app.removeClass(curEls[i], 'current');
            }
            app.addClass($('#ep' + player.episode()), 'current');
        },

        /*
         * Toggles shuffle
         */
        toggleShuffle: function() {
            var shuffleButton = $("#toggleShuffle");
            if (player.isShuffling) {
                player.index = player.indexInPlaylist(player.originalPlaylist);
                player.setCurrentPlaylist(player.originalPlaylist);
                app.removeClass(shuffleButton,"glow");
                player.isShuffling = false;
            }
            else {
                player.setCurrentPlaylist(player.getShuffledPlaylist());
                player.index = 0;
                player.isShuffling = true;
                app.addClass(shuffleButton,"glow");
            }
        },

        /*
         * Toggles muting
         */
        toggleVolume: function() {
            var volumeButton = $("#toggleVolume");
            if (player.YTPlayer.isMuted()) {
                if (player.SCPlayer) {
                    player.SCPlayer.setVolume(player.volume/100);
                }
                if (player.YTPlayer) {
                    player.YTPlayer.unMute();
                }
                $("#volume").style.width = player.volume+"%";
                app.removeClass(volumeButton,"iconicstroke-volume-mute");
                app.addClass(volumeButton,"iconicstroke-volume");
            }
            else {
                if (player.SCPlayer) {
                    player.SCPlayer.setVolume(0);
                }
                if (player.YTPlayer) {
                    player.YTPlayer.mute();
                }
                $("#volume").style.width = "0%";
                app.removeClass(volumeButton,"iconicstroke-volume");
                app.addClass(volumeButton,"iconicstroke-volume-mute");
            }
            player.isMuted = !player.isMuted;
        },

        /*
         * Sets the volume
         *
         * Accepts an object event which has a key offsetX with value 0 < int < 50
         */
        setVolume: function(event) {
            player.volume = Math.ceil(event.offsetX/50 * 100);
            $("#volume").style.width = player.volume+"%";
            player.YTPlayer.setVolume(player.volume);

            if (player.isMuted) {
                app.removeClass(volumeButton,"iconicstroke-volume-mute");
                app.addClass(volumeButton,"iconicstroke-volume");
            } else {
                player.SCPlayer.setVolume(player.volume/100);
            }
        },

        /*
         * Creates a shuffled playlist under player.shuffledPlaylist, sets it as the current playlist
         * Find the current song and sets the current playing index accordingly
         */
        getShuffledPlaylist: function() {
            var shuffledPlaylist = JSON.parse(JSON.stringify(player.playlist()));
            var counter = player.playlist().length;
            var temp;
            var index;

            // While there are elements in the array
            while (counter > 0) {
                // Pick a random index
                index = Math.floor(Math.random() * counter);

                // Decrease counter by 1
                counter--;

                // And swap the last element with it
                temp = shuffledPlaylist[counter];
                shuffledPlaylist[counter] = shuffledPlaylist[index];
                shuffledPlaylist[index] = temp;
            }

            var indexOfCurrentSong = player.indexInPlaylist(shuffledPlaylist);
            var songToAdd = shuffledPlaylist.splice(indexOfCurrentSong, 1);
            shuffledPlaylist.unshift(songToAdd[0]);

            return shuffledPlaylist;
        }
    };

    var player = app.player;

    /*
     * Polls the server for a new version of the playlsit
     */
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

    /*
     * Hides error notice
     */
    app.hideError = function() {
        $("#error").style.display = "none";
    };

    /*
     * Shows error notice
     *
     * Accepts str message
     * Accepts str lifeTime or bool=false for forever
     */
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

    /*
     * Shows success notice
     *
     * Accepts str message
     */
    app.showSuccess = function(message) {
        $("#success").style.display = "block";
        if (typeof message === "string") {
            $("#success").innerHTML = message;
        }
        setTimeout(function() {
            $("#success").style.display = "none";
        }, 3000);
    };

    /*
     * Toggles fullscreen mode
     */
    app.toggleFullscreen = function() {
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
        }

    };

    /*
     * Adds a html5 history entry
     */
    app.addHistory = function() {
        let episode = player.currentSong();
        let newTitle = title.episode
            .replace('$$ARTIST', episode.artist)
            .replace('$$SONG_TITLE', episode.title)
            .replace('$$ARTIST', episode.artist)
            .replace('$$EPISODE', episode.episode)
            .replace('$$SITE_TITLE', site_title);

        history.replaceState({index:player.index}, newTitle, ""+player.episode());
        $("#pagetitle").innerHTML = newTitle;
        if (ga) {
            ga('send', {
                'hitType': 'pageview',
                'page': '/'+player.episode(),
                'title': newTitle
            });
        }
    };

    /*
     * Handles the popstate event redirecting to the appropriate song
     */
    app.handlePopState = function(event) {
        var episode = parseInt(window.location.pathname.substr(1));

        player.index = 0;
        if (!isNaN(episode) && typeof episode === "number" ) {
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

    /*
     * Handles keydown events
     */
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
        else if (event.keyCode === 72) { // h
            player.toggleLike();
        }
        else if (event.keyCode === 73) { // i
            player.toggleInfoShow();
        }
        else if (event.keyCode === 76) { // l
            player.toggleLikedOnly();
        }
        else if (event.keyCode === 80) { // p
            player.togglePlaylistShow();
        }
        else if (event.keyCode === 83) { // s
            player.toggleShuffle();
        }
        else if (event.keyCode === 86) { // v
            player.togglePlayerShow();
        }
    };

    /*
     * Initializes the app
     */
    app.init = function() {

        // Show server side errors
        if ($("#error").innerHTML !== "") {
            app.showError();
        }
        // Load playlist
        app.updatePlaylist(function () {
            player.setCurrentPlaylist(player.originalPlaylist);

            app.handlePopState();

            window.onpopstate = app.handlePopState;

            // Create and init player
            app.player.init();

            //Bind events
            document.addEventListener("keydown", app.onKeyDown, false);

            var buttons = $("a");
            for(var i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener('click', function(event) {
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
                });
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
