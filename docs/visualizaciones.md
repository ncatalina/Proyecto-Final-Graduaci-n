# Códigos de visualizaciones - Dashboard Descuadres - Hoja Descuadre mensual
En este archivo se detallan las expresiones de Qlik Sense utilizadas para las visualizaciones.

## 1. KPIs Principales

### Centros descuadrados:
Este indicador cuenta los centros que presentan una desviación mayor o igual a 0.05
```qlik
=Count(DISTINCT IF(Fabs(
    Aggr(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad), 
    Centro)) >= 0.05, Centro ))
```
### Cantidad de descuadre MTD:

``` qlik
=Sum(Aggr( IF((Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) >= 0.05 ),
Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad)),Centro))
```

### Cantidad de descuadre absoluto MTD:

``` qlik
=Sum(Aggr( IF((Fabs(Sum({1<[Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad) ) >= 0.05 ),
            Fabs( Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad) )),
         Centro, Material, ProductoMovimiento))
```

## 2. Gráficos

### Centro descuadrados por rango:

#### Dimensión

``` qlik
=Aggr(Dual( 
        IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 2000, 
            'Mayor a 2000',
        IF( Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 1000, 
            '1001-2000',
        IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 500, 
            '501-1000',
        IF( Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 100, 
            '101-500',
        IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 50, 
            '51-100',
            '1-50'))))),
        IF( Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 2000, 6,
        IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 1000, 5,
        IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 500, 4,
        IF( Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 100, 3,
        IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) > 50, 2,
            1 )))))),Centro)
```
 #### Medida

 ``` qlik
=Count( DISTINCT IF( Fabs( Aggr( Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad),
         Centro )) >= 0.05, Centro))
```
