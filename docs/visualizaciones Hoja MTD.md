# Códigos de visualizaciones - Dashboard Descuadres - Hoja Descuadre mensual
En este archivo se detallan las expresiones de Qlik Sense utilizadas para las visualizaciones.

## 0. Filtros
### Producto Copec

```qlik
=ProductoMovimiento
```
### Material

```qlik
=Material
```
## 1. KPIs Principales

### Fecha de datos

```qlik
='Datos hasta: ' & vFechaMaximaDatos
```

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

### Centros descuadrados por producto Copec:

#### Dimensión

 ``` qlik
=ProductoMovimiento
```

#### Medida

 ``` qlik
=Count( DISTINCT IF( Fabs(Aggr(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad),
                Centro, ProductoMovimiento)) >= 0.05, Centro))
```
## 3. Tablas

### Descuadres por Producto Copec:
Este indicador cuenta los centros que presentan una desviación mayor o igual a 0.05

#### Columna: Producto Copec

```qlik
=If(IsNull([ProductoMovimiento]) or Len(Trim([ProductoMovimiento]))=0, 'EN BLANCO', [ProductoMovimiento])
```

#### Columna: Cantidad

```qlik
=Sum(Aggr(IF((Fabs( Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad) ) >= 0.05),
           Sum({1<[Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad) ),
       Centro, ProductoMovimiento))
```

#### Columna: Cantidad absoluta

```qlik
=Sum(Aggr(IF((Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) >= 0.05),
          Fabs(Sum({1<[Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad))),
       Centro, Material, ProductoMovimiento))
```

#### Columna: Last 14 days

```qlik
=Sum(Aggr(IF((Fabs(Sum({1< [Fecha Contable] = {">=$(=Date(vFechaMaximaDatos - 13)) <=$(=Date(vFechaMaximaDatos))"}>} Cantidad)) >= 0.05),
            Sum({1< [Fecha Contable] = {">=$(=Date(vFechaMaximaDatos - 13)) <=$(=Date(vFechaMaximaDatos))"}>} Cantidad)),
        Centro, ProductoMovimiento))
```

#### Columna: % of total

```qlik
=(Sum(Aggr(IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) >= 0.05,
Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad))),
            Centro, Material, ProductoMovimiento)))
/
(Sum(TOTAL Aggr(IF(Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) >= 0.05,
            Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad))),
        Centro, Material, ProductoMovimiento)))
```

### Top 10 centros con mayores descuadres absolutos

#### Columna: Centro

```qlik
=Centro
```

#### Columna: Cantidad absoluta

```qlik
=Sum(Aggr(IF((Fabs(Sum({1<[Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad)) >= 0.05),
     Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) ),
        Centro, Material, ProductoMovimiento))
```

#### Columna: Cantidad 

```qlik
=Sum(Aggr(IF((Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad)) >= 0.05),
     Sum({1<[Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad)), Centro))
```

#### Columna: Motivo del descuadre

```qlik
=If(Sum(Cantidad) > 0, 'Liquidación pendiente',
  If(Sum(Cantidad) < 0, 'Recompra pendiente',
    'Saldo Cero / Inactivo'))
```







