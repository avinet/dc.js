dc.statColorScales = {
    /**
     * Color scale custom for adm-board
     *
     * @return {d3.scale.ordinal} A color scale that may be used by diagrams
     */
    admOrdinal: function () {
      return d3.scale.ordinal().range([
        '#FF0200', '#D9007B', '#FF6700',
        '#FEFF00', '#00CC05', '#0053CC',
        '#8B00CC', '#FF0200', '#FFCD00',
        '#A8E500', '#0098CC'
      ]);
    },
  
    /**
     * Color scale from iPodNano apps
     *
     * @return {d3.scale.ordinal} A color scale that may be used by diagrams
     */
    iPodNano: function () {
      return d3.scale.ordinal().range([
        '#8569CF', '#0D9FD8', '#8AD749',
        '#EECE00', '#F8981F', '#F80E27',
        '#F640AE', '#E2E2E2', '#787679'
      ]);
    },
  
    /**
     * Color scale from Google
     *
     * @return {d3.scale.ordinal} A color scale that may be used by diagrams
     */
    google: function (highlightSeries, highlightColor) {
      var cs = d3.scale.ordinal().range([
        '#3366cc', '#dc3912', '#ff9900', '#109618',
        '#990099', '#0099c6', '#dd4477', '#66aa00',
        '#b82e2e', '#316395', '#994499', '#22aa99',
        '#aaaa11', '#6633cc', '#e67300', '#8b0707',
        '#651067', '#329262', '#5574a6', '#3b3eac'
      ]);
  
      if (highlightSeries !== undefined && highlightSeries.constructor === Array &&
          highlightSeries.length > 0 && highlightColor !== undefined) {
        return function (value) {
          if (highlightSeries.indexOf(value) !== -1) {
            return highlightColor;
          } else {
            return cs(value);
          }
        };
      } else {
        return function (value) {
          return cs(value);
        };
      }
    },
  
    plannedActual: function () {
      return d3.scale.ordinal().domain([
        'Black',
        'Planned',
        'Actual'
      ]).range([
        '#000000',
        '#3366cc',
        '#dc3912'
      ]);
    }
  };