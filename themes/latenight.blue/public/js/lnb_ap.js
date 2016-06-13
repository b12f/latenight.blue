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
