  var formInfo ={dataList:[],weight2send:0,weightReceived:0};
  var socket = io();
  socket.on('filecount', function(count) {
    
     $('#fileInfo2').append('Nombre de fichiers correctement trait&#233;es:<span> '+count+'</span><br/>')
    })

  socket.on('saved', function(data) {
    console.log('saved: name '+data.name+ " size: "+data.size)
    var divId='#d_'+ Base64.encode(data.name).replace(/=/gi,'')
    console.log('change: '+divId)
   $(divId).css('border-color','lime')
    
    })


$('#uplBtn').on('click', function (){
    $('#upload-input').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
      $('#fileInfo2').html('&nbsp;')
});

$(document).ready(function() { 
   $.ajax({ 
           url:'/foldersList',
           type: 'GET',
           success: function(data){

             data.list.forEach( function(mail,idx){
              $('#folderSelect').append($('<option>', {value:mail, text:mail}));

               })
             
              }
           })
   });
   
   
   
   
 $('#folderSelect').on('change', function(){
  console.log('folderSelect has changed')
  if( $('#folderSelect').val()!=='') $('#uplBtn').attr('disabled',false);
  else $('#uplBtn').attr('disabled',true);
 if( $('#folderSelect').val()!=='')
       $.ajax({
      url: '/setFolder',
      type: 'PATCH',
      data: 'folder='+$('#folderSelect').val(),
      success: function(data){
     $('#fileInfo1').html('Nombre de fichiers d&#233;ja pr&#233;sents:<span> '+data.fileList.length+'</span>')
         
      },
       })

  /*    $.ajax({
      url: '/setFolder',
      type: 'PATCH',
      data: $('#folderSelect').val(),
      processData: false,
      contentType: false,
      success: function(data){
          console.log('upload successful!\n' + data);
         
      },
      xhr: function() { 
        // create an XMLHttpRequest


        return xhr;
      }
        })    */
    
  })


$('#upload-input__').on('change', function(){

  var files = $(this).get(0).files;

  if (files.length > 0){
    // create a FormData object which will be sent as the data payload in the
    // AJAX request
    var formData = new FormData();
    
    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload

      formData.append('mail', $('#folderSelect').val());
      formData.append('uploads[]', file, file.name);
    }
    $('#fileInfo1').html('Nombre de fichiers a envoyer:<span>'+files.length+'</span>')
    console.log("Nbr de fichier:"+files.length)
    console.log(formData)

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
          console.log('upload successful!\n' + data);
         
      },
      xhr: function() { 
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // listen to the 'progress' event
        xhr.upload.addEventListener('progress', function(evt) {
          $('#uplBtn').attr('disabled',true);
          if (evt.lengthComputable) {
            // calculate the percentage of upload completed
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);

            // update the Bootstrap progress bar with the new percentage
            $('.progress-bar').text(percentComplete + '%');
            $('.progress-bar').width(percentComplete + '%');

            // once the upload reaches 100%, set the progress bar text to done
            if (percentComplete === 100) {
              $('.progress-bar').html('Done');
              $('#uplBtn').attr('disabled',false);
            }

          }

        }, false),
        xhr.upload.addEventListener('loadend', function(evt) {
        	console.log(evt)
        	
        })

        return xhr;
      }
    });

  }
});



$('#upload-input').on('change', function(){
console.log("upload-input has changed")
  var files = $(this).get(0).files;

  if (files.length > 0){

    // create a FormData object which will be sent as the data payload in the
    // AJAX request

    var fileList=[]
    formInfo.dataList = []
   var readerArray=[]
    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
       var fData = new FormData();
       var file = files[i];
       fileList.push(file)
       formInfo.weight2send+=file.size
       fData.set('mail', $('#folderSelect').val());
       file.id=Base64.encode(file. name).replace(/=/gi,'')
       fData.append('uploads', file, file.name);
       console.log(fData)
       formInfo.dataList.push({formData:fData,divId:file.id,fileSize:file.size} )
       $('#fileInfo1').html('Nombre de fichiers a envoyer:<span>'+formInfo.dataList.length+'</span>')
       console.log(formInfo.weight2send)
      //  $('#debg_count span.dbg_nbr').html("weight2send:"+formInfo.weight2send)
     
    
   



    $('#fileInfo2').append('<div id="d_'+file.id+'"><span class="placeholder"><img  id="i_'+file.id+'"  class="thumb" title="'+file.name+'" src="https://placehold.it/90"></img></span><div class="uploadDiv"></div></div>')

    
    }
     console.log("Nbr de fichier:"+files.length)   
    fileList.forEach( function(file, idx){

      var imgId="#i_"+file.id
      if(file.type.split('/')[0] === "image" ){
      var  reader = new FileReader()
        reader.onload = function (e) {
            $(imgId).attr('src', e.target.result) 
          }
       reader.readAsDataURL(file);
      }
      else {
        $(imgId).attr('src', "https://placehold.it/90?text="+file.type.split('/')[0]) 
      }

      
    }) 
    
 $('#sendBtn').attr('disabled',false);





  }
});

$('#sendBtn').on('click', function(){


  formInfo.dataList.forEach( function(fm,idx){
 var    statusDivId = '#d_'+fm.divId+' div.uploadDiv'

   $(statusDivId).addClass('running')

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: fm.formData,
      processData: false,
      contentType: false,
      success: function(data){
          console.log('upload successful!\n' + data);
          formInfo.weightReceived+=data.receivedBytes
          
             $(statusDivId).addClass('uploadOk').removeClass('running')
            progressBar(Number.parseFloat(formInfo.weightReceived/formInfo.weight2send * 100).toFixed(0)) 
              $('#debg_count span.dbg_nbr2').html("weightReceived:"+ Number.parseFloat(formInfo.weightReceived/formInfo.weight2send * 100).toFixed(0) )
      },
      xhr: function() { 
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();
      return xhr
        },
      beforeSend: function( xhr ) {
        }
     
    })
    
    
  })
  
  
})


function progressBar(percentComplete){
   $('.progress-bar').text(percentComplete + '%');
   $('.progress-bar').width(percentComplete + '%');
    if (percentComplete === 100) {
      $('.progress-bar').html('Done');
      $('#uplBtn').attr('disabled',false);
    }
}

var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}