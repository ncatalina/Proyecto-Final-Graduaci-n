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
Indica al usuario la fecha de corte de la información para contextualizar la vigencia del análisis presentado.

```qlik
='Datos hasta: ' & vFechaMaximaDatos
```

### Centros descuadrados:
Este indicador identifica y cuantifica los centros que presentan un descuadre menor a -0,05 o mayor a 0,05 para el mes actual
```qlik
=Count(DISTINCT IF(Fabs(
    Aggr(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad), 
    Centro)) >= 0.05, Centro ))
```
### Cantidad de descuadre MTD:
Mide el impacto neto acumulado durante el mes en curso

``` qlik
=Sum(Aggr( IF((Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)) >= 0.05 ),
Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad)),Centro))
```

### Cantidad de descuadre absoluto MTD:
Determina la magnitud total del error logístico, sumando desviaciones positivas y negativas por igual
``` qlik
=Sum(Aggr( IF((Fabs(Sum({1<[Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad) ) >= 0.05 ),
            Fabs( Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad) )),
         Centro, Material, ProductoMovimiento))
```

## 2. Gráficos

### Centro descuadrados por rango:
Analiza la severidad de las irregularidades clasificando los centros según la cantidad

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
Permite visualizar que tipo de producto concentra la mayor cantidad de centros con descuadres

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
Proporciona un desglose por producto que incluye tendencias de los últimos 14 días y participación sobre el total

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
Ranking de los casos más críticos y diagnostica si requiere liquidación o recompra según el signo de la cantidad

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







