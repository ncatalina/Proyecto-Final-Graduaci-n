
const ID_CARPETA_ORIGEN = '1Ch0SEGf_w4RILqfLp4Di5VFL17BmKOwJ'; 
const NOMBRE_ARCHIVO_CSV = "Historico_Consolidado_Copec.csv"; 
const NOMBRE_ARCHIVO_CONTROL = "Control_Versiones.json";
const BATCH_SIZE = 5000;
const MODO_INICIALIZACION = false;

const NOMBRES_COLUMNAS_DETALLADAS = {
  FECHA_CONTABLE: 'Fecha contab.', 
  CENTRO: 'Centro',
  MATERIAL: 'Material',
  PRODUCTO: 'Producto Copec', 
  CANTIDAD: 'Cantidad' 
};

// =========================================================================================
// FUNCIONES DE FECHA Y UTILIDADES
// =========================================================================================

function obtenerFechaInstantanea(archivo) {
  return archivo.getLastUpdated().getTime();
}

function extraerFechaDelNombre(nombreArchivo) {
  const match = nombreArchivo.match(/SAP_(\d{4})(\d{2})(\d{2})/);
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


function obtenerControlVersiones(carpeta) {
  try {
    const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CONTROL);
    if (archivos.hasNext()) {
      const contenido = archivos.next().getBlob().getDataAsString();
      return JSON.parse(contenido);
    }
  } catch (e) {
    Logger.log('[CONTROL] Error leyendo control: ' + e.toString());
  }
  return {};
}

function guardarControlVersiones(carpeta, control) {
  try {
    const contenido = JSON.stringify(control, null, 2);
    const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CONTROL);
    
    if (archivos.hasNext()) {
      archivos.next().setContent(contenido);
    } else {
      carpeta.createFile(NOMBRE_ARCHIVO_CONTROL, contenido, MimeType.PLAIN_TEXT);
    }
    Logger.log('[CONTROL] Guardado exitosamente');
  } catch (e) {
    Logger.log('[CONTROL] Error guardando: ' + e.toString());
  }
}

function inicializarControlHistoricos() {
  const carpeta = DriveApp.getFolderById(ID_CARPETA_ORIGEN);
  const control = obtenerControlVersiones(carpeta);
  
  const fechaActual = new Date();
  const mesActualClave = Utilities.formatDate(fechaActual, Session.getScriptTimeZone(), 'yyyy-MM');
  
  let iterador = carpeta.getFiles();
  let contador = 0;
  
  Logger.log('CONTROL DE HISTÓRICOS\n');
  
  while (iterador.hasNext()) {
    const archivo = iterador.next();
    const nombre = archivo.getName();
    
    if (!nombre.match(/SAP_(\d{8})/)) continue;
    
    const fechaNombre = extraerFechaDelNombre(nombre);
    if (!fechaNombre) continue;
    
    const claveMes = Utilities.formatDate(fechaNombre, Session.getScriptTimeZone(), 'yyyy-MM');
    
    if (claveMes >= mesActualClave) continue;
    
    const ts = obtenerFechaInstantanea(archivo);
    const fileId = archivo.getId();
    
    if (!control[claveMes] || ts > control[claveMes].timestamp) {
      control[claveMes] = {
        fileId: fileId,
        fileName: nombre,
        timestamp: ts,
        procesado: new Date().toISOString()
      };
      contador++;
      Logger.log(`[REGISTRADO] ${claveMes}: ${nombre}`);
    }
  }
  
  guardarControlVersiones(carpeta, control);
  
  Logger.log(`\n ${contador} meses históricos registrados`);
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
// FUNCION PRINCIPAL
// =========================================================================================

function consolidarHaciaCSV() {
  if (MODO_INICIALIZACION) {
    Logger.log('MODO INICIALIZACIÓN ACTIVADO\n');
    inicializarControlHistoricos();
    return;
  }
  
  const carpeta = DriveApp.getFolderById(ID_CARPETA_ORIGEN);
  const control = obtenerControlVersiones(carpeta);
  
  const fechaActual = new Date();
  const mesActualClave = Utilities.formatDate(fechaActual, Session.getScriptTimeZone(), 'yyyy-MM');
  
  let latestFileIdMTD = null;
  let latestTimestampMTD = 0;
  let latestNombreMTD = '';
  
  let iterador = carpeta.getFiles();
  
  Logger.log('ESCANEO DE ARCHIVOS\n');
  
  while (iterador.hasNext()) {
    const archivo = iterador.next();
    const nombre = archivo.getName();
    
    if (!nombre.match(/SAP_(\d{8})/)) continue;
    
    const fechaNombre = extraerFechaDelNombre(nombre);
    if (!fechaNombre) continue;
    
    const claveMes = Utilities.formatDate(fechaNombre, Session.getScriptTimeZone(), 'yyyy-MM');
    
    if (claveMes === mesActualClave) {
      const ts = obtenerFechaInstantanea(archivo);
      if (ts > latestTimestampMTD) {
        latestTimestampMTD = ts;
        latestFileIdMTD = archivo.getId();
        latestNombreMTD = nombre;
      }
    }
  }
  
  if (!latestFileIdMTD) {
    Logger.log(' No se encontró archivo MTD para el mes actual');
    return;
  }
  
  const controlMTD = control[mesActualClave];
  
  if (controlMTD && 
      controlMTD.fileId === latestFileIdMTD && 
      controlMTD.timestamp === latestTimestampMTD) {
    Logger.log(` MTD ${mesActualClave} ya está actualizado: ${controlMTD.fileName}`);
    Logger.log(`Última actualización: ${controlMTD.procesado}`);
    return;
  }
  
  Logger.log(`Procesando MTD: ${latestNombreMTD}\n`);
  
  Logger.log(' Leyendo CSV existente...');
  const datosExistentesCSV = leerCSVExistente(carpeta);
  
  const datosHistoricos = datosExistentesCSV.filter(fila => {
    const fechaMes = fila[0].substring(0, 7); // yyyy-MM
    return fechaMes !== mesActualClave;
  });
  
  Logger.log(` Manteniendo ${datosHistoricos.length} filas de meses históricos`);
  
  const archivo = DriveApp.getFileById(latestFileIdMTD);
  let archivoLectura = archivo;
  let idTemporal = null;
  
  if (archivo.getMimeType() !== MimeType.SPREADSHEET) {
    try {
      Logger.log(' Convirtiendo archivo Excel...');
      Utilities.sleep(2000);
      const copia = { title: 'TEMP_' + archivo.getName(), mimeType: MimeType.GOOGLE_SHEETS };
      const conv = Drive.Files.copy(copia, latestFileIdMTD, {convert: true});
      archivoLectura = DriveApp.getFileById(conv.id);
      idTemporal = conv.id;
    } catch (e) {
      Logger.log(`Error conversión: ${e.toString()}`);
      return;
    }
  }

  let datosNuevosMTD = [];
  
  try {
    const ss = SpreadsheetApp.open(archivoLectura);
    const datos = ss.getSheets()[0].getDataRange().getValues();
    const tipo = detectarEstructuraArchivo(datos[0]);
    
    Logger.log(`Estructura detectada: ${tipo}`);
    
    let res;
    
    if (tipo === 'DETALLADA') {
      res = procesarArchivoDetallado(datos, datos[0], latestTimestampMTD);
    } else if (tipo === 'HISTORICO_SIMPLE') {
      res = procesarArchivoHistoricoSimple(datos, datos[0], latestTimestampMTD, latestNombreMTD);
    } else if (tipo === 'AGREGADA') {
      res = procesarArchivoAgregado(datos, datos[0], latestTimestampMTD, latestNombreMTD);
    }

    if (res && res.exito) {
      datosNuevosMTD = res.filas;
      Logger.log(` ${res.filasLeidas} filas leídas del MTD`);
    }
  } catch (err) {
    Logger.log(` Error procesando: ${err.toString()}`);
  } finally {
    if (idTemporal) {
      try { DriveApp.getFileById(idTemporal).setTrashed(true); } catch(e) {}
    }
  }
  
  const mapaMTD = {};
  datosNuevosMTD.forEach(fila => {
    const clave = fila[0];
    const ts = fila[1];
    if (!mapaMTD[clave] || ts > mapaMTD[clave].ts) {
      let cantidadConComa = String(fila[6]).replace('.', ',');
      mapaMTD[clave] = {
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
  
  const filasMTD = Object.values(mapaMTD).map(i => i.datos.join(';'));
  
  Logger.log(` ${filasMTD.length} filas únicas del MTD`);
  
  const filasFinales = [...datosHistoricos, ...filasMTD];
  
  Logger.log(`\n Generando CSV final (${filasFinales.length} filas)...`);
  
  const contenido = "Fecha Contable;Centro;Producto Copec;Material;Cantidad;Fecha Version\n" + filasFinales.join('\n');
  
  const existentes = carpeta.getFilesByName(NOMBRE_ARCHIVO_CSV);
  
  if (existentes.hasNext()) {
    existentes.next().setContent(contenido);
  } else {
    carpeta.createFile(NOMBRE_ARCHIVO_CSV, contenido, MimeType.PLAIN_TEXT);
  }
  
  control[mesActualClave] = {
    fileId: latestFileIdMTD,
    fileName: latestNombreMTD,
    timestamp: latestTimestampMTD,
    procesado: new Date().toISOString()
  };
  
  guardarControlVersiones(carpeta, control);
  
  Logger.log(`\nRESULTADO`);
  Logger.log(`Total filas: ${filasFinales.length.toLocaleString()}`);
  Logger.log(`CSV actualizado: ${NOMBRE_ARCHIVO_CSV}`);
  Logger.log('\n COMPLETADO');
}


function leerCSVExistente(carpeta) {
  try {
    const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CSV);
    if (!archivos.hasNext()) {
      Logger.log('[CSV] No existe archivo previo, se creará uno nuevo');
      return [];
    }
    
    const contenido = archivos.next().getBlob().getDataAsString();
    const lineas = contenido.split('\n');
    
    const filas = [];
    for (let i = 1; i < lineas.length; i++) {
      if (lineas[i].trim()) {
        filas.push(lineas[i]);
      }
    }
    
    Logger.log(`[CSV] ${filas.length} filas leídas del archivo existente`);
    return filas;
    
  } catch (e) {
    Logger.log(`[CSV] Error leyendo: ${e.toString()}`);
    return [];
  }
}

// =========================================================================================
// FUNCIONES AUXILIARES 
// =========================================================================================

function limpiarCSVAntiguo() {
  const carpeta = DriveApp.getFolderById(ID_CARPETA_ORIGEN);
  const archivos = carpeta.getFilesByName(NOMBRE_ARCHIVO_CSV);
  
  if (archivos.hasNext()) {
    archivos.next().setTrashed(true);
    Logger.log(' CSV antiguo eliminado');
  }
  
  const control = carpeta.getFilesByName(NOMBRE_ARCHIVO_CONTROL);
  if (control.hasNext()) {
    control.next().setTrashed(true);
    Logger.log(' Control eliminado');
  }
}
