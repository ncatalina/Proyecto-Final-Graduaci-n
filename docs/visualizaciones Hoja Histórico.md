# Códigos de visualizaciones - Dashboard Descuadres - Hoja Descuadre histórico
En este archivo se detallan las expresiones de Qlik Sense utilizadas para las visualizaciones.

## 0. Filtros

### Fecha

```qlik
=FechaContable
```
### Producto Copec

```qlik
=ProductoMovimiento
```
### Material

```qlik
=Material
```

## 1. KPIs Principales

### Centros descuadrados
Cuantifica la cantidad de centros únicos que han presentado desviaciones fuera del margen de tolerancia (>0,05 0 <-0,05) a lo largo del tiempo

```qlik
=Count(DISTINCT Aggr(IF((Sum(Cantidad) > 0.05) OR (Sum(Cantidad) < -0.05), Centro), Centro))
```
### Cantidad de descuadre
Calcula el saldo neto acumulado de los descuadres a lo largo del tiempo

```qlik
=Sum(Aggr(IF((Fabs(Sum(Cantidad)) >= 0.05), Sum(Cantidad)), Centro ))
```
### Cantidad de descuadre absoluto
Mide el volumen total de movimientos, sumando el impacto total de las desviaciones sin compensar saldos positivos y negativos

```qlik
=Sum(Aggr(IF((Fabs(Sum(Cantidad)) >= 0.05), Fabs(Sum(Cantidad))), Centro, Material, ProductoMovimiento))
```
## 2. Gráficos

### Centro descuadrados por rango:
Clasifica los centros según la magnitud de su descuadre histórico para identificar la severidad

#### Dimensión

``` qlik
=Aggr(
    IF(IF(Sum(Cantidad) >= 0, Sum(Cantidad), -Sum(Cantidad)) > 2000, 'Mayor a 2001',
    IF(IF(Sum(Cantidad) >= 0, Sum(Cantidad), -Sum(Cantidad)) > 1000, '1001-2000',
    IF(IF(Sum(Cantidad) >= 0, Sum(Cantidad), -Sum(Cantidad)) > 500, '501-1000',
    IF(IF(Sum(Cantidad) >= 0, Sum(Cantidad), -Sum(Cantidad)) > 100, '101-500',
    IF(IF(Sum(Cantidad) >= 0, Sum(Cantidad), -Sum(Cantidad)) > 50, '51-100',
        '1-50'))))), Centro)
```
 #### Medida

 ``` qlik
=Count(DISTINCT If(Aggr(Sum(Cantidad), Centro) > 0.05 OR Aggr(Sum(Cantidad), Centro) < -0.05, Centro))
```

### Centros descuadrados por producto Copec:
Visualiza la recurrencia de errores en centros por tipo de producto para detectar patrones de falla por categoría a lo largo del tiempo

#### Dimensión

 ``` qlik
=ProductoMovimiento
```

#### Medida

 ``` qlik
=Count(DISTINCT IF(Fabs(Aggr(Sum(Cantidad), Centro , ProductoMovimiento)) >= 0.05, Centro))
```
## 3. Tablas

### Descuadres por Producto Copec:
Presenta el detalle histórico por producto, incorporando una comparativa de los últimos 3 meses para el análisis de tendencias de mediano - largo plazo

#### Columna: Producto Copec

```qlik
=If(IsNull([ProductoMovimiento]) or Len(Trim([ProductoMovimiento]))=0, 'EN BLANCO', [ProductoMovimiento])
```

#### Columna: Cantidad

```qlik
=Sum(Aggr(IF((Fabs(Sum(Cantidad) ) >= 0.05), Sum(Cantidad)),Centro, ProductoMovimiento))
```

#### Columna: Cantidad absoluta

```qlik
=Sum(Aggr( IF(( Fabs( Sum(Cantidad) ) >= 0.05),Fabs(Sum(Cantidad))), Centro, Material, ProductoMovimiento))
```

#### Columna: Last 3 Months

```qlik
=Sum(Aggr(IF((Fabs(Sum({1<  [Fecha Contable] = {">=$(=AddMonths(vFechaMaximaDatos, -3)) <=$(=vFechaMaximaDatos)"}>} Cantidad)  ) >= 0.05),
            Sum({1<  [Fecha Contable] = {">=$(=AddMonths(vFechaMaximaDatos, -3)) <=$(=vFechaMaximaDatos)"}>} Cantidad)),   Centro, ProductoMovimiento))
```

#### Columna: % of total

```qlik
=(Sum(Aggr(IF(Fabs(Sum(Cantidad)) >= 0.05, Fabs(Sum(Cantidad))), Centro, Material, ProductoMovimiento)))
/
(Sum(TOTAL Aggr(IF(Fabs(Sum(Cantidad) ) >= 0.05, Fabs(Sum(Cantidad))), Centro, Material, ProductoMovimiento)))
```

### Top 10 centros con mayores descuadres absolutos
Clasifica los centros con mayor impacto histórico y diagnostica su estado (liquidación o recompra) basándose en el saldo de sus movimientos
#### Columna: Centro

```qlik
=Centro
```

#### Columna: Cantidad absoluta

```qlik
=Sum(Aggr(IF((Fabs(Sum(Cantidad)) >= 0.05), Fabs(Sum(Cantidad))), Centro, Material, ProductoMovimiento))
```

#### Columna: Cantidad 

```qlik
=Sum(Aggr(IF((Fabs(Sum(Cantidad)) >= 0.05), Sum(Cantidad)), Centro))
```

#### Columna: Motivo del descuadre

```qlik
=If(Sum(Cantidad) > 0, 'Liquidación pendiente',
  If(Sum(Cantidad) < 0, 'Recompra pendiente',
    'Saldo Cero / Inactivo'))
```
