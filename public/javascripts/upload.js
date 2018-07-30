  var socket = io();
  socket.on('filecount', function(count) {
    console.log('count:'+count)
     $('#fileInfo2').html('Nombre de fichiers correctement trait&#233;es:<span> '+count+'</span>')
    })



$('.upload-btn').on('click', function (){
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





$('#upload-input').on('change', function(){

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
