const ID_CARPETA_ORIGEN = '1Ch0SEGf_w4RILqfLp4Di5VFL17BmKOwJ'; 
const NOMBRE_ARCHIVO_CSV = "Historico_Consolidado_Copec.csv"; 
const BATCH_SIZE = 5000;

const NOMBRES_COLUMNAS_DETALLADAS = {
  FECHA_CONTABLE: 'Fecha contab.', 
  CENTRO: 'Centro',
  MATERIAL: 'Material',
  PRODUCTO: 'Producto Copec', 
  CANTIDAD: 'Cantidad' 
};


function obtenerFechaInstantanea(archivo) {
  return archivo.getLastUpdated().getTime();
}

function extraerFechaDelNombre(nombreArchivo) {
  const match = nombreArchivo.match(/SAP_(\d{4})(\d{2})(\d{2})_/);
  if (match) {
    const año = parseInt(match[1]);
    const mes = parseInt(match[2]) - 1; 
    const dia = parseInt(match[3]);
    return new Date(año, mes, dia);
  }
  return null;
}

function detectarEstructuraArchivo(encabezados) {
  const tieneEstructuraDetallada = encabezados.includes(NOMBRES_COLUMNAS_DETALLADAS.FECHA_CONTABLE);
  const primeraColumna = encabezados[0] || '';
  const segundaColumna = encabezados[1] || '';
  
  if (tieneEstructuraDetallada) return 'DETALLADA';
  if (primeraColumna.toLowerCase().includes('centro') && segundaColumna.toLowerCase().includes('producto')) return 'HISTORICO_SIMPLE';
  if ((primeraColumna.toLowerCase().includes('suma') || primeraColumna.toLowerCase().includes('etiqueta')) && segundaColumna.toLowerCase().includes('producto')) return 'AGREGADA';
  
  return 'DESCONOCIDA';
}

/**
 * Limpia y formatea números para evitar errores de interpretación (Punto como decimal)
 */
function limpiarNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return valor;
  

  let str = valor.toString().trim();
  

  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {

    str = str.replace(',', '.');
  }
  
  let num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}



function procesarArchivoDetallado(datosFuente, encabezados, fechaInstantaneaMs) {
  const indices = {
    FECHA_CONTABLE: encabezados.indexOf(NOMBRES_COLUMNAS_DETALLADAS.FECHA_CONTABLE),
    CENTRO: encabezados.indexOf(NOMBRES_COLUMNAS_DETALLADAS.CENTRO),
    MATERIAL: encabezados.indexOf(NOMBRES_COLUMNAS_DETALLADAS.MATERIAL),
    PRODUCTO: encabezados.indexOf(NOMBRES_COLUMNAS_DETALLADAS.PRODUCTO),
    CANTIDAD: encabezados.indexOf(NOMBRES_COLUMNAS_DETALLADAS.CANTIDAD)
  };
  
  const filas = [];
  for (let i = 1; i < datosFuente.length; i++) {
    const fila = datosFuente[i];
    const cantidad = limpiarNumero(fila[indices.CANTIDAD]);
    if (cantidad === 0) continue;

    const fechaContable = fila[indices.FECHA_CONTABLE] instanceof Date ? fila[indices.FECHA_CONTABLE] : new Date(fila[indices.FECHA_CONTABLE]);
    const fechaStr = Utilities.formatDate(fechaContable, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const clave = `${fila[indices.CENTRO]}|${fila[indices.PRODUCTO]}|${fila[indices.MATERIAL]}|${fechaStr}`;

    filas.push([clave, fechaInstantaneaMs, fechaStr, fila[indices.CENTRO], fila[indices.PRODUCTO], fila[indices.MATERIAL], cantidad]);
  }
  return { exito: true, filas: filas, filasLeidas: filas.length };
}

function procesarArchivoHistoricoSimple(datosFuente, encabezados, fechaInstantaneaMs, nombreArchivo) {
  const idxC = encabezados.findIndex(col => col.toLowerCase().includes('centro'));
  const idxP = encabezados.findIndex(col => col.toLowerCase().includes('producto'));
  const idxM = encabezados.findIndex(col => col.toLowerCase().includes('material'));
  const idxQ = encabezados.findIndex(col => col.toLowerCase().includes('cantidad'));
  
  const fechaDelNombre = extraerFechaDelNombre(nombreArchivo);
  const fechaContable = new Date(fechaDelNombre.getFullYear(), fechaDelNombre.getMonth() + 1, 0);
  const fechaStr = Utilities.formatDate(fechaContable, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const filas = [];
  for (let i = 1; i < datosFuente.length; i++) {
    const fila = datosFuente[i];
    const cantidad = limpiarNumero(fila[idxQ]);
    if (cantidad === 0) continue;

    const material = idxM !== -1 ? fila[idxM] : 'HISTORICO';
    const clave = `${fila[idxC]}|${fila[idxP]}|${material}|${fechaStr}`;
    filas.push([clave, fechaInstantaneaMs, fechaStr, fila[idxC], fila[idxP], material, cantidad]);
  }
  return { exito: true, filas: filas, filasLeidas: filas.length };
}

function procesarArchivoAgregado(datosFuente, encabezados, fechaInstantaneaMs, nombreArchivo) {
  const fechaDelNombre = extraerFechaDelNombre(nombreArchivo) || new Date();
  const fechaStr = Utilities.formatDate(fechaDelNombre, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  const filas = [];
  let centroActual = '';
  for (let i = 1; i < datosFuente.length; i++) {
    const fila = datosFuente[i];
    if (fila[0] && !fila[1]) { centroActual = fila[0]; continue; }
    const cantidad = limpiarNumero(fila[2]);
    if (fila[1] && cantidad !== 0) {
      const clave = `${centroActual}|${fila[1]}|AGREGADO|${fechaStr}`;
      filas.push([clave, fechaInstantaneaMs, fechaStr, centroActual, fila[1], 'N/A', cantidad]);
    }
  }
  return { exito: true, filas: filas, filasLeidas: filas.length };
}

// =========================================================================================
// FUNCIÓN PRINCIPAL
// =========================================================================================
function consolidarHaciaCSV() {
  const carpeta = DriveApp.getFolderById(ID_CARPETA_ORIGEN);
  const fechaActual = new Date();
  const mesActualClave = Utilities.formatDate(fechaActual, Session.getScriptTimeZone(), 'yyyy-MM');
  
  let latestFileIdMTD = null;
  let latestTimestampMTD = 0;
  let instantaneasPorMesHistorico = {}; 
  
  let iterador = carpeta.getFiles(); 
  while (iterador.hasNext()) {
    const archivo = iterador.next();
    const nombre = archivo.getName();
    if (!nombre.match(/SAP_(\d{8})_/)) continue;
    
    const fechaNombre = extraerFechaDelNombre(nombre);
    const claveMes = Utilities.formatDate(fechaNombre, Session.getScriptTimeZone(), 'yyyy-MM');
    const ts = obtenerFechaInstantanea(archivo);
    
    if (claveMes === mesActualClave) {
      if (ts > latestTimestampMTD) { latestTimestampMTD = ts; latestFileIdMTD = archivo.getId(); }
    } else {
      if (!instantaneasPorMesHistorico[claveMes] || ts > instantaneasPorMesHistorico[claveMes].maxTime) {
        instantaneasPorMesHistorico[claveMes] = { maxTime: ts, id: archivo.getId() };
      }
    }
  }

  let idsAProcesar = Object.values(instantaneasPorMesHistorico).map(item => item.id);
  if (latestFileIdMTD) idsAProcesar.push(latestFileIdMTD);

  let datosConsolidados = [];
  let copiasTemporales = [];

  idsAProcesar.forEach((fileId, index) => {
    const archivo = DriveApp.getFileById(fileId);
    let archivoLectura = archivo;
    
    if (archivo.getMimeType() !== MimeType.SPREADSHEET) {
      try {
        Logger.log(` Convirtiendo ${index + 1}/${idsAProcesar.length}: ${archivo.getName()}`);
        Utilities.sleep(2000); 
        const copia = { title: 'TEMP_' + archivo.getName(), mimeType: MimeType.GOOGLE_SHEETS };
        const conv = Drive.Files.copy(copia, fileId, {convert: true});
        archivoLectura = DriveApp.getFileById(conv.id);
        copiasTemporales.push(conv.id);
      } catch (e) {
        Logger.log(` Error conversión ${archivo.getName()}`);
        return; 
      }
    }

    try {
      const ss = SpreadsheetApp.open(archivoLectura);
      const datos = ss.getSheets()[0].getDataRange().getValues();
      const tipo = detectarEstructuraArchivo(datos[0]);
      let res;
      
      if (tipo === 'DETALLADA') res = procesarArchivoDetallado(datos, datos[0], obtenerFechaInstantanea(archivo));
      else if (tipo === 'HISTORICO_SIMPLE') res = procesarArchivoHistoricoSimple(datos, datos[0], obtenerFechaInstantanea(archivo), archivo.getName());
      else if (tipo === 'AGREGADA') res = procesarArchivoAgregado(datos, datos[0], obtenerFechaInstantanea(archivo), archivo.getName());

      if (res && res.exito) {
        datosConsolidados = datosConsolidados.concat(res.filas);
        Logger.log(`Procesado: ${archivo.getName()}`);
      }
    } catch (err) {
      Logger.log(` Error leyendo ${archivo.getName()}: ${err.toString()}`);
    }
  });

  copiasTemporales.forEach(id => {
    try { DriveApp.getFileById(id).setTrashed(true); } catch(e) {}
  });

  aplicarLogicaCSV(datosConsolidados);
}



function aplicarLogicaCSV(datosNuevos) {
  if (datosNuevos.length === 0) return Logger.log('No hay datos.');
  
  const mapaFinal = {};
  datosNuevos.forEach(fila => {
    const clave = fila[0];
    const ts = fila[1];
    if (!mapaFinal[clave] || ts > mapaFinal[clave].ts) {
      
      
      let cantidadConComa = String(fila[6]).replace('.', ','); 

      mapaFinal[clave] = {
        ts: ts,
        datos: [
          fila[2], 
          `"${fila[3]}"`, 
          `"${fila[4]}"`, 
          `"${fila[5]}"`, 
          cantidadConComa, 
          Utilities.formatDate(new Date(ts), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
        ]
      };
    }
  });

  
  const filasCSV = Object.values(mapaFinal).map(i => i.datos.join(';'));
  const contenido = "Fecha Contable;Centro;Producto Copec;Material;Cantidad;Fecha Version\n" + filasCSV.join('\n');
  
  const carpeta = DriveApp.getFolderById(ID_CARPETA_ORIGEN);
  const existentes = carpeta.getFilesByName(NOMBRE_ARCHIVO_CSV);
  
  if (existentes.hasNext()) existentes.next().setContent(contenido);
  else carpeta.createFile(NOMBRE_ARCHIVO_CSV, contenido, MimeType.PLAIN_TEXT);

  Logger.log(' CSV Generado con Punto y Coma. Filas únicas: ' + filasCSV.length);
}
