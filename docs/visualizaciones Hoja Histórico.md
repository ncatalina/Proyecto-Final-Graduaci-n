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

```qlik
=Count(DISTINCT Aggr(IF((Sum(Cantidad) > 0.05) OR (Sum(Cantidad) < -0.05), Centro), Centro))
```
### Cantidad de descuadre

```qlik
=Sum(Aggr(IF((Fabs(Sum(Cantidad)) >= 0.05), Sum(Cantidad)), Centro ))
```
### Cantidad de descuadre absoluto

```qlik
=Sum(Aggr(IF((Fabs(Sum(Cantidad)) >= 0.05), Fabs(Sum(Cantidad))), Centro, Material, ProductoMovimiento))
```

