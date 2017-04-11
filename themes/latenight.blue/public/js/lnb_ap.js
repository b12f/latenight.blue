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

$('#title').focus();

$('#queue-tab-button').addEventListener('click', function () {
    $('#queue-tab-button').classList.add('active');
    $('#pl-tab-button').classList.remove('active');
    $('#queue').classList.remove('hidden');
    $('#playlist').classList.add('hidden');
});

$('#pl-tab-button').addEventListener('click', function () {
    $('#queue-tab-button').classList.remove('active');
    $('#pl-tab-button').classList.add('active');
    $('#queue').classList.add('hidden');
    $('#playlist').classList.remove('hidden');
});
