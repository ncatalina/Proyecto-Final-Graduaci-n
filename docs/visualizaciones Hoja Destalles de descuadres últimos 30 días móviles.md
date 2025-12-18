# Códigos de visualizaciones - Dashboard Descuadres - Hoja Detalles de descuadres últimos 30 días móviles
En este archivo se detallan las expresiones de Qlik Sense utilizadas para las visualizaciones.

## 1. Tablas

### Detalle de descuadres consecutivos por Fecha
Esta tabla alerta la cantidad de centros descuadrados para cada día

#### Columna: 30 días móviles

```qlik
=If( [Fecha Contable] >= Date(Today() - 30) AND  [Fecha Contable] <= Date(Today()), [Fecha Contable], Null())
```
#### Columna: Centro

```qlik
=Centro
```
#### Columna: Centro descuadrados

```qlik
=Count(DISTINCT IF(Fabs( Aggr(Sum(Cantidad), Centro, [Fecha Contable] )) >= 0.05, Centro))
```
#### Columna: Cantidad Absoluta crítica

```qlik
=Sum(Aggr(IF(Fabs(Aggr(Sum(Cantidad), Centro, [Fecha Contable])) >= 0.05, Fabs(Sum(Cantidad))), Centro, [Fecha Contable]))
```

### Detalle de descuadres consecutivos por Centro
Esta tabla alerta la cantidad de centros descuadrados para cada día

#### Columna: Centro

```qlik
=Aggr(If(Sum(Aggr(If( [Fecha Contable] >= Today() - 30
       AND Fabs(Sum(Cantidad)) >= 0.05
       AND Above(Fabs(Sum(Cantidad)), 1) >= 0.05
       AND Above(Fabs(Sum(Cantidad)), 2) >= 0.05
       AND Above([Fecha Contable], 1) >= Today() - 30
       AND Above([Fecha Contable], 2) >= Today() - 30
       AND NOT(Sign(Sum(Cantidad)) <> Sign(Above(Sum(Cantidad)))
               AND Fabs(Fabs(Sum(Cantidad)) - Fabs(Above(Sum(Cantidad)))) <= 0.1)
       AND NOT(Sign(Above(Sum(Cantidad))) <> Sign(Above(Sum(Cantidad), 2))
               AND Fabs(Fabs(Above(Sum(Cantidad))) - Fabs(Above(Sum(Cantidad), 2))) <= 0.1), 1, 0), Centro, [Fecha Contable])) > 0, 
      Centro, Null()), Centro)
```
#### Columna: Fecha

```qlik
=If([Fecha Contable] >= Date(Today() - 30) AND [Fecha Contable] <= Date(Today()), [Fecha Contable], Null())
```
#### Columna: Alarma 3 días

```qlik
=If(Dimensionality() = 2,
 If([Fecha Contable] >= Today() - 30
      AND Fabs(Sum(Cantidad)) >= 0.05
      AND Above(Fabs(Sum(Cantidad)), 1) >= 0.05
      AND Above(Fabs(Sum(Cantidad)), 2) >= 0.05
      AND Above([Fecha Contable], 1) >= Today() - 30
      AND Above([Fecha Contable], 2) >= Today() - 30
       AND NOT(Sign(Sum(Cantidad)) <> Sign(Above(Sum(Cantidad)))
            AND Fabs(Fabs(Sum(Cantidad)) - Fabs(Above(Sum(Cantidad)))) <= 0.1)
       AND NOT(Sign(Above(Sum(Cantidad))) <> Sign(Above(Sum(Cantidad), 2))
            AND Fabs(Fabs(Above(Sum(Cantidad))) - Fabs(Above(Sum(Cantidad), 2))) <= 0.1), 1, 0),
 If(Sum(Aggr(If([Fecha Contable] >= Today() - 30
                    AND Fabs(Sum(Cantidad)) >= 0.05
                    AND Above(Fabs(Sum(Cantidad)), 1) >= 0.05
                    AND Above(Fabs(Sum(Cantidad)), 2) >= 0.05
                    AND Above([Fecha Contable], 1) >= Today() - 30
                    AND Above([Fecha Contable], 2) >= Today() - 30
                    AND NOT(Sign(Sum(Cantidad)) <> Sign(Above(Sum(Cantidad)))
                        AND Fabs(Fabs(Sum(Cantidad)) - Fabs(Above(Sum(Cantidad)))) <= 0.1)
                    AND NOT(Sign(Above(Sum(Cantidad))) <> Sign(Above(Sum(Cantidad), 2))
                        AND Fabs(Fabs(Above(Sum(Cantidad))) - Fabs(Above(Sum(Cantidad), 2))) <= 0.1), 1, 0),
                Centro, [Fecha Contable])) > 0, 3, Null()))
```
#### Columna: Cantidad

```qlik
=Sum(Cantidad)
```





