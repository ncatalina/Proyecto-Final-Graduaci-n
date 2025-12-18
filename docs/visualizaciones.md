Centros descuadrados: =Count(DISTINCT IF(Fabs(
       Aggr(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad),
                Centro)) >= 0.05, Centro ))


Cantidad de descuadre MTD: =Sum(
    Aggr( IF((Fabs(Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"} >} Cantidad)
                ) >= 0.05 ),Sum({1< [Fecha Contable] = {">=$(=MonthStart(vFechaMaximaDatos)) <=$(=vFechaMaximaDatos)"}>} Cantidad)),
      Centro))


