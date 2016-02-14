// Set app object
console.log("<3");

function $(q){
    if(q.substring(0,1)==="#"){
        return document.querySelector(q);
    }
    else{
        return document.querySelectorAll(q);
    }
}

var titles = [];
var artists = [];
var albums = [];
var urls = ["https://www.youtube.com/watch?v="];
for(var i = 0; i < playlist.length; i++){
  titles.push(playlist[i].title);
  artists.push(playlist[i].artist);
  albums.push(playlist[i].album);
}

var options = {
  fontSize: '16px',
  fontFamily: 'IconicStroke, sans-serif',
  proptInnerHTML: '',
  color: 'white',
  backgroundColor: '#282c34',
  hintColor: 'grey',
  dropDownBorderColor: '#1C1E24',
  dropDownOnHoverBackgroundColor: '#3E4451'
}

var onInputChange = function (text) {
  /*var c;
  this.startFrom = text.indexOf(', ')+1;
  var twocolors = text.split(', ');
  c = c2h[twocolors[0]];
  if (c) document.body.style.backgroundColor = c;
  else   document.body.style.backgroundColor = '#282c55';
  c = c2h[twocolors[1]];
  if (c) document.getElementById('btm').style.backgroundColor = c;
  else   document.getElementById('btm').style.backgroundColor = '#282c34';*/
  this.repaint();
};



if($("#error").innerHTML !== ""){
  $("#error").style.display = "block";
  setTimeout(function(){
    $("#error").style.display = "none";
  }, 3000);
}

if($("#success").innerHTML !== ""){
  $("#success").style.display = "block";
  setTimeout(function(){
    $("#success").style.display = "none";
  }, 3000);
}

options.name = "title";
options.placeholder = "Title";
var title = completely($("#title"), options);
title.options = titles;
title.onChange = onInputChange;
setTimeout(function() { title.input.focus(); title.repaint(); },25);

options.name = "artist";
options.placeholder = "Artist";
var artist = completely($("#artist"), options);
artist.options = artists;
artist.onChange = onInputChange;
setTimeout(function() { artist.input.focus(); artist.repaint(); },25);

options.name = "album";
options.placeholder = "Album";
var album = completely($("#album"), options);
album.options = albums;
album.onChange = onInputChange;
setTimeout(function() { album.input.focus(); album.repaint(); },25);

options.name = "url";
options.placeholder = "Youtube Link";
var url = completely($("#url"), options);
url.options = urls;
url.onChange = onInputChange;
setTimeout(function() { url.input.focus(); url.repaint(); },25);
