
const FOLDER_ID = '1Ch0SEGf_w4RILqfLp4Di5VFL17BmKOwJ'; 
const EMAIL_SUBJECT = 'DINAMO:REVISAR DIFERENCIAS ALMACEN V001'; 

function procesarAdjuntosDescuadres() {
  const carpetaDestino = DriveApp.getFolderById(FOLDER_ID);
  const query = `subject:"${EMAIL_SUBJECT}" is:unread has:attachment`;
  const threads = GmailApp.search(query);
  
  Logger.log(`Se encontraron ${threads.length} hilos de correo.`);

  threads.forEach(thread => {
    const messages = thread.getMessages();
    
    messages.forEach(message => {
      const attachments = message.getAttachments();
      
      attachments.forEach(attachment => { 
        const attachmentFileName = attachment.getName();
        if (attachmentFileName.endsWith('.xls') || attachmentFileName.endsWith('.xlsx')) {
          const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
          const nuevoNombre = `SAP_${timestamp}_${attachmentFileName}`; 
          carpetaDestino.createFile(attachment).setName(nuevoNombre);
          
          Logger.log(`Archivo guardado: ${nuevoNombre}`);
        }
      });
      
      message.markRead();
    });
  });
}
