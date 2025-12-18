# Códigos de visualizaciones - Dashboard Descuadres
En este archivo se detallan las expresiones de Qlik Sense utilizadas para las visualizaciones.

## 1. KPIs Principales

### Centros descuadrados:
Este indicador cuenta los centros que presentan una desviación mayor o igual a 0.05
```qlik
=Count(DISTINCT IF(Fabs(
    Aggr(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad), 
    Centro)) >= 0.05, Centro ))

### Cantidad de descuadre MTD:
=Sum(Aggr( IF((Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) >= 0.05 ),
Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad)),Centro))


