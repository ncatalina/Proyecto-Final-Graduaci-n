const ID_CARPETA_ORIGEN = '1Ch0SEGf_w4RILqfLp4Di5VFL17BmKOwJ'; 
const NOMBRE_ARCHIVO_CSV = "Historico_Consolidado_Copec.csv"; 
const NOMBRE_ARCHIVO_CONTROL = "Control_Versiones.json";

function consolidarHaciaCSV() {
  const carpeta = DriveApp.getFolderById(ID_CARPETA_ORIGEN);
  const control = obtenerControlVersiones(carpeta);
  
  const archivosMaestros = identificarArchivosMaestros(carpeta);
  const mesesEnCarpeta = Object.keys(archivosMaestros).sort();

  if (mesesEnCarpeta.length === 0) {
    Logger.log('No se encontraron archivos válidos con formato SAP_YYYYMMDD_HHMMSS_DD-MM-YYYY.');
    return;
  }

  let lineasCSV = leerCSVExistente(carpeta);
  let huboCambios = false;

  const hoy = new Date();
  const mesActualClave = Utilities.formatDate(hoy, Session.getScriptTimeZone(), 'yyyy-MM');

  mesesEnCarpeta.forEach(mesClave => {
    const info = archivosMaestros[mesClave];
    const reg = control[mesClave];

    if (!reg || info.versionNum > reg.versionNum || mesClave === mesActualClave) {
      Logger.log(`Procesando datos de: ${mesClave}`);
      Logger.log(`Archivo maestro (Versión más reciente): ${info.nombre}`);
      
      if (mesClave !== mesActualClave) {
        Logger.log(`Detectado como actualización de HISTÓRICO.`);
      } else {
        Logger.log(`Detectado como actualización de MTD (Mes en curso).`);
      }

      const totalAntes = lineasCSV.length;
      lineasCSV = lineasCSV.filter(linea => {
        const fechaFila = linea.split(';')[0].replace(/"/g, '');
        return extraerMesUniversal(fechaFila) !== mesClave;
      });
      
      const filasEliminadas = totalAntes - lineasCSV.length;
      Logger.log(`LIMPIEZA: Se eliminaron ${filasEliminadas} filas del mes ${mesClave} para reemplazarlas.`);

      const nuevasFilas = extraerDatosDeArchivo(info.id, info.ts);
      lineasCSV = lineasCSV.concat(nuevasFilas);
      
      Logger.log(`ACTUALIZACIÓN: Se agregaron ${nuevasFilas.length} filas nuevas.`);

      control[mesClave] = {
        fileId: info.id,
        fileName: info.nombre,
        timestamp: info.ts,
        versionNum: info.versionNum, 
        fechaProceso: new Date().toLocaleString()
      };
      huboCambios = true;
    }
  });

  if (huboCambios) {
    const encabezado = "Fecha Contable;Centro;Producto Copec;Material;Cantidad;Fecha Version";
    const contenidoFinal = encabezado + "\n" + lineasCSV.join('\n');
    escribirArchivoCSV(carpeta, contenidoFinal);
    guardarControlVersiones(carpeta, control);
    Logger.log(`PROCESO FINALIZADO: El CSV ahora tiene ${lineasCSV.length} filas en total.`);
  } else {
    Logger.log('TODO AL DÍA: No hay versiones nuevas para procesar.');
  }
}


function identificarArchivosMaestros(carpeta) {
  const maestros = {};
  const archivos = carpeta.getFiles();
  
  while (archivos.hasNext()) {
    const a = archivos.next();
    const nombre = a.getName();

    const match = nombre.match(/SAP_(\d{8})_(\d{6})_(\d{2})-(\d{2})-(\d{4})/);
    
    if (!match) continue;

    const mesDatosClave = `${match[5]}-${match[4]}`; 

    const versionNum = parseInt(match[1] + match[2]);

    if (!maestros[mesDatosClave] || versionNum > maestros[mesDatosClave].versionNum) {
      maestros[mesDatosClave] = {
        id: a.getId(),
        nombre: nombre,
        versionNum: versionNum,
        ts: a.getLastUpdated().getTime()
      };
    }
  }
  return maestros;
}

function extraerMesUniversal(texto) {
  if (!texto) return null;
  const partes = texto.split('-');
  if (partes.length < 3) return null;
  if (partes[0].length === 4) return `${partes[0]}-${partes[1]}`; 
  if (partes[2].length >= 4) return `${partes[2].substring(0,4)}-${partes[1]}`; 
  return null;
}

function extraerDatosDeArchivo(id, ts) {
  const archivo = DriveApp.getFileById(id);
  let idTemp = null;
  let excel = archivo;

  if (archivo.getMimeType() !== MimeType.SPREADSHEET) {
    const conv = Drive.Files.copy({title: 'TMP_'+id, mimeType: MimeType.GOOGLE_SHEETS}, id, {convert: true});
    excel = DriveApp.getFileById(conv.id);
    idTemp = conv.id;
  }

  const ss = SpreadsheetApp.open(excel);
  const datos = ss.getSheets()[0].getDataRange().getValues();
  const encabezados = datos[0];
  const fVersion = Utilities.formatDate(new Date(ts), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  
  const idx = {
    FC: encabezados.findIndex(c => c.toLowerCase().includes('contab')),
    C: encabezados.findIndex(c => c.toLowerCase().includes('centro')),
    M: encabezados.findIndex(c => c.toLowerCase().includes('material')),
    P: encabezados.findIndex(c => c.toLowerCase().includes('producto')),
    Q: encabezados.findIndex(c => c.toLowerCase().includes('cantidad'))
  };

  const resultados = [];
  for (let i = 1; i < datos.length; i++) {
    const f = datos[i];
    const cant = limpiarNumero(f[idx.Q]);
    if (cant === 0) continue;

    const fechaObj = f[idx.FC] instanceof Date ? f[idx.FC] : new Date(f[idx.FC]);
    const fContable = Utilities.formatDate(fechaObj, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    resultados.push(`"${fContable}";"${f[idx.C]}";"${f[idx.P]}";"${f[idx.M]}";${String(cant.toFixed(3)).replace('.', ',')};"${fVersion}"`);
  }

  if (idTemp) DriveApp.getFileById(idTemp).setTrashed(true);
  return resultados;
}

function leerCSVExistente(carpeta) {
  const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CSV);
  if (!archivos.hasNext()) return [];
  const contenido = archivos.next().getBlob().getDataAsString();
  return contenido.split('\n').slice(1).filter(l => l.trim() !== '');
}

function escribirArchivoCSV(carpeta, contenido) {
  const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CSV);
  if (archivos.hasNext()) archivos.next().setContent(contenido);
  else carpeta.createFile(NOMBRE_ARCHIVO_CSV, contenido, MimeType.PLAIN_TEXT);
}

function obtenerControlVersiones(carpeta) {
  const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CONTROL);
  return archivos.hasNext() ? JSON.parse(archivos.next().getBlob().getDataAsString()) : {};
}

function guardarControlVersiones(carpeta, control) {
  const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CONTROL);
  const txt = JSON.stringify(control, null, 2);
  if (archivos.hasNext()) archivos.next().setContent(txt);
  else carpeta.createFile(NOMBRE_ARCHIVO_CONTROL, txt, MimeType.PLAIN_TEXT);
}

function limpiarNumero(v) {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  let s = v.toString().trim().replace(/\./g, '').replace(',', '.');
  let n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
