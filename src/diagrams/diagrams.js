dc.statDiagrams = {
  monthMap: {
    '1': 'J',
    '2': 'F',
    '3': 'M',
    '4': 'A',
    '5': 'M',
    '6': 'J',
    '7': 'J',
    '8': 'A',
    '9': 'S',
    '10': 'O',
    '11': 'N',
    '12': 'D'
  },

  scaleWidth: function (width, offset) {
    return offset * width / 100;
  },

  scaleHeight: function (height, offset) {
    return offset * height / 100;
  },

  /**
   * Internal id counter for numbering objects
   *
   * @type Number
   * @private
   * @ignore
   */
  objectId: 0,

  options: {
    minHeight: 300,
    xAxisTitle: '',
    yAxisTitle: '',
    margins: {
      'top': 60,
      'right': 20,
      'bottom': 40,
      'left': 40
    },
    legend: true,
    autoItemWidth: false,
    legendItemHeight: 15,
    legendGap: 5,
    colors: dc.statColorScales.google(),
    horizontalLegend: true,
    xAxisLabelRotate: false,
    xAxisLabelOffsetX: 0,
    xAxisLabelOffsetY: 0,
    valueAccessor: function (d) {
      return d.value;
    },
    keyAccessor: function (d) {
      return d.key;
    },
    seriesAccessor: function (d) {
      return d.value;
    }
  },

  /**
   * Compares elements in an array of objects based on the properties key[0] and key[1]
   *
   * @param {Object} a Object with array property named key with two elements
   * @param {Object} b Same as a
   * @return {Number} -1 if a is smaller than b, 1 if a is
   * greater than b and 0 if there is no difference
   */
  compare2DKey: function (a, b) {
    var am = a.key.split('|');
    var bm = b.key.split('|');

    if (am.length < 2 || bm.length < 2) {
      return 0;
    }

    var ak = am[0];
    var bk = bm[0];
    var ask = am[1];
    var bsk = bm[1];

    if (ak < bk) {
      return -1;
    } else if (ak > bk) {
      return 1;
    } else if (+ask < +bsk) {
      return -1;
    } else if (+ask > +bsk) {
      return 1;
    } else {
      return 0;
    }
  },

  /**
   * Create a new quasi group omitting the group with the key ignore
   *
   * @param {crossfilter.group} group A crossfilter group
   * @param {String} keyValue [description]
   * @return {crossfilter.group} Quasi crossfilter group object implementing .all() method
   */
  groupStripKey: function (group, keyValue) {
    return {
      all: function () {
        var tmpGroup = group.all();

        for (var i = 0; i < tmpGroup.length; i++) {
          if (tmpGroup[i].key === keyValue) {
            tmpGroup.splice(i, 1);
            break;
          }
        }

        return tmpGroup;
      }
    };
  },

  /**
   * Creates a quasi dimension with a running sum based on the value accessor function specified
   *
   * @param {crossfilter.group} group A group that must implement the function group.all()
   * @param {String} keyName The name of the running sum property
   * @param {function} valueAccessor A function to retrieve the value that the running sum shall be based on
   * @return {crossfilter.group} A quasi group that only implements the function group.all()
   */
  getRunningSumFor2DKeyGroup: function (group, keyName, valueAccessor) {
    if (keyName === undefined) {
      keyName = 'runningSum';
    }

    if (valueAccessor === undefined) {
      valueAccessor = function (d) {
        return d.value;
      };
    }

    return {
      all: function () {
        var runningSum = 0;
        var prevKey0 = '';
        var data = group.all();

        for (var i = 0; i < data.length; i++) {
          var currKey = data[i].key.split('|')[0];

          if (currKey !== prevKey0) {
            runningSum = 0;
          }

          var currentValue = valueAccessor(data[i]);

          runningSum += isNaN(currentValue) ? 0 : currentValue;

          data[i][keyName] = runningSum;

          prevKey0 = currKey;
        }

        return data;
      }
    };
  },

  dropDownFilterProjStatus: function (title, selector, selectedStatus, callbackFunction) {
    var statusCodes = [
      'Execution',
      'Liability',
      'Completed',
      'Closed'
    ];

    var controlId = 'ddf' + this.objectId++;

    var select = $('<select/>')
          .attr('id', controlId)
          .addClass('form-control');

    var label = $('<label/>')
          .attr('for', controlId)
          .text(title);

    for (var i = 0; i < statusCodes.length; i++) {
      var o = $('<option/>')
              .attr('value', statusCodes[i])
              .text(statusCodes[i]);
      select.append(o);
    }

    select.val(selectedStatus);

      // Add change event
    select.on('change', function () {
      callbackFunction($(this).val());
    });

    $(selector)
          .empty()
          .append(label)
          .append(select)
          .addClass('form-group');
  },

  dropDownFilterYear: function (title, selector, years, selectedYear, callbackFunction) {
    var controlId = 'ddf' + this.objectId++;
    var select = $('<select/>')
          .attr('id', controlId)
          .addClass('form-control');
    var label = $('<label/>')
          .attr('for', controlId)
          .text(title);

    for (var i = 0; i < years.length; i++) {
      var o = $('<option/>')
              .attr('value', years[i])
              .text(years[i]);
      select.append(o);
    }

    select.val(selectedYear);

      // Add change event
    select.on('change', function () {
      callbackFunction($(this).val());
    });

    $(selector)
          .empty()
          .append(label)
          .append(select)
          .addClass('form-group');
  },

  /**
   * Create a dropdown filter for use with a dc visualization
   *
   * @param {string} title The title to use for the dropdown
   * @param {string} selector The $ selector to identify the element
   * @param {crossfilter.dimension[]} dim A crossfilter dimension referencing data
   * @param {string} [useKey=false] A flag that determines if the key or the value
   * is to be used in the filter expression
   */
  dropDownFilter: function (title, selector, dim, useKey) {
    if (useKey === undefined) {
      useKey = false;
    }

    var controlId = 'ddf' + this.objectId++;
    var select = $('<select/>')
          .attr('id', controlId)
          .addClass('form-control');
    var label = $('<label/>')
          .attr('for', controlId)
          .text(title);
    var emptyOption = $('<option/>')
          .attr('value', '')
          .text('Not filtered');
    select.append(emptyOption);
    var values = dim[0].group()
          .all();
    for (var i = 0; i < values.length; i++) {
      var o = $('<option/>')
              .attr('value', values[i].value)
              .text(values[i].key);
      select.append(o);
    }

      // Add change event
    select.on('change', function () {
      var e = $(this);
      var key = e.find(':selected')
              .text();
      var value = e.val();
      for (var d = 0; d < dim.length; d++) {
        if (value === '') {
          dim[d].filterAll();
        } else {
          if (useKey === false) {
            dim[d].filter(value);
          } else {
            dim[d].filter(key);
          }
        }
      }
      dc.redrawAll();
    });

    $(selector)
          .empty()
          .append(label)
          .append(select)
          .addClass('form-group');
  },

  /**
   * Callback function for this.dropDownFilter
   *
   * callback dropDownFilterCallback
   * @param {string} key The selected key
   * @param {string|number} value The selected value
   */

  /**
   * A function that returns the initial object for a reduce average
   * operation in a Crossfilter group
   *
   * @returns {Object}
   */
  getReduceInitialCountUnique: function () {
    return {
      occurrences: [],
      count: 0,
      sum: 0
    };
  },

  getReduceAddCountUnique: function (countProperty, uniqueProperty) {
    return function (p, v) {
      if (p.occurrences.indexOf(v[uniqueProperty]) !== -1) {
        p.occurences.push(v[uniqueProperty]);
        p.count++;
        p.sum += v[countProperty];
      }
      return p;
    };
  },

  getReduceRemoveCountUnique: function (countProperty, uniqueProperty) {
    return function (p, v) {
      var i = p.occurrences.indexOf(v[uniqueProperty]);
      if (i !== -1) {
        p.occurences.splice(i, 1);
        p.count--;
        p.sum -= v[countProperty];
      }
      return p;
    };
  },

  /**
   * Perform a reduce count unique operation on a crossfilter group
   *
   * @param {crossfilter.group} group Group to be processed
   * @param {String} countProperty Name of property to count/sum
   * @param {String} uniqueProperty Name of property to check for uniqueness
   * @return {crossfilter.group} New, reduced group
   */
  reduceCountUnique: function (group, countProperty, uniqueProperty) {
    return group.reduce(
          this.getReduceAddCountUnique(countProperty, uniqueProperty),
          this.getReduceRemoveCountUnique(countProperty, uniqueProperty),
          this.getReduceInitialCountUnique);
  },

  /**
   * A function that returns the initial object for a reduce average
   * operation in a Crossfilter group
   *
   * @returns {Object}
   */
  getReduceInitialAvg: function () {
    return {
      count: 0,
      sum: 0,
      avg: 0
    };
  },

  /**
   * A function that returns the initial object for a reduce sum
   * operation in a Crossfilter group
   *
   * @returns {Number}
   */
  getReduceInitialSum: function () {
    return 0;
  },

  /**
   * Creates a reduce sum function
   *
   * @param {String} fieldName [description]
   * @return {Object} Update reduce initial sum
   */
  getReduceAddSum: function (fieldName) {
    return function (p, v) {
      p += (+v[fieldName]);
      return p;
    };
  },

  getReduceRemoveSum: function (fieldName) {
    return function (p, v) {
      p -= (+v[fieldName]);
      return p;
    };
  },

  /**
   * A function that returns the initial object for a reduce average
   * operation in a Crossfilter group
   *
   * @param {function} includeIfTrue A function that evaluates if the value is to be ignored or not
   * @returns {Object}
   */
  getReduceInitialAvgFunc: function (includeIfTrue) {
    if (includeIfTrue === undefined) {
      includeIfTrue = function () {
        return true;
      };
    }
    return function () {
      return {
        includeIfTrue: includeIfTrue,
        count: 0,
        sum: 0,
        avg: 0
      };
    };
  },

  /**
   * Creates a Crossfilter reduce add function for calculating averages
   *
   * @param {type} propertyName Name of a property that exist in each object
   * @returns {function}
   */
  getReduceAddAvg: function (propertyName) {
    return function (p, v) {
      if ((p.includeIfTrue === undefined || p.includeIfTrue(v)) && !isNaN(v[propertyName])) {
        ++p.count;
        p.sum += v[propertyName];
      }
      p.avg = p.sum === 0 ? 0 : p.sum / p.count;
      return p;
    };
  },

  /**
   * Creates a Crossfilter reduce remove function for calculating averages
   *
   * @param {type} propertyName Name of a property that exist in each object
   * @returns {function}
   */
  getReduceRemoveAvg: function (propertyName) {
    return function (p, v) {
      if ((p.includeIfTrue === undefined || p.includeIfTrue(v)) && !isNaN(v[propertyName])) {
        --p.count;
        p.sum -= v[propertyName];
      }
      p.avg = p.sum === 0 ? 0 : p.sum / p.count;
      return p;
    };
  },

  /**
   * Perform a reduce average operation on a crossfilter group
   *
   * @param {crossfilter.group} group Group to be averaged
   * @param {String} property Name of property to average
   * @return {crossfilter.group} New, reduced group
   */
  reduceAvg: function (group, property) {
    return group.reduce(
          this.getReduceAddAvg(property),
          this.getReduceRemoveAvg(property),
          this.getReduceInitialAvg);
  },

  referenceLine: function (chart, value, text, allign) {
    chart.on('renderlet', function (chart) {
      var lineData = [{
        x: 0,
        y: chart.y()(value)
      }, {
        x: chart.width() - chart.margins().left - chart.margins().right,
        y: chart.y()(value)
      }];

      var line = d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .interpolate('linear');

      var chartBody = chart.select('g.chart-body');

      chartBody
        .selectAll('path.extra')
        .data([lineData])
        .enter()
        .append('path').attr({
          'class': 'refline',
          'stroke': '#000',
          'stroke-width': '1px',
          'shape-rendering': 'crispEdges'
        })
        .attr('d', line);

      if (text) {
        chartBody
          .selectAll('text.extra-label')
          .data([text])
          .enter()
          .append('text').attr({
            'class': 'refline-label',
            'x': allign === 'start' ? 0 : chart.width() - chart.margins().left - chart.margins().right,
            'y': chart.y()(value) })
          .style({
            'text-anchor': allign || 'end',
            'startOffset': '50%' })
          .text(text);
      }
    });
  },

  /**
   * Create a line chart for 53 weeks
   *
   * @param {string} domSelector
   * @param {crossfilter.dimension} dimension
   * @param {crossfilter.group} group
   * @param {string} yAxisLabel
   * @param {function} valueAccessor
   * @returns {dc.chart}
   */
  areaChartWeeks: function (domSelector, dimension, group, yAxisLabel, valueAccessor) {
    return this.areaChartMonths(domSelector, dimension, group, yAxisLabel, valueAccessor, 1, 53);
  },

  /**
   * Create a line chart for 12 months
   *
   * @param {string} domSelector
   * @param {crossfilter.dimension} dimension
   * @param {crossfilter.group} group
   * @param {string} yAxisLabel
   * @param {function} valueAccessor
   * @returns {dc.chart}
   */
  areaChartMonths: function (domSelector, dimension, group, yAxisLabel, valueAccessor) {
    return this.areaChartMonths(domSelector, dimension, group, yAxisLabel, valueAccessor, 1, 12);
  },

  /**
   * Create an area chart for 12 months
   *
   * @param {string} domSelector
   * @param {crossfilter.dimension} dimension
   * @param {crossfilter.group} group
   * @param {string} yAxisLabel
   * @param {function} [valueAccessor=function] A function that receives a data object as a parameter
   *   and that should return a single value
   * @param {number} [min=1]
   * @param {number} [max=12]
   * @return {dc.chart} A chart object from dc.js
   */
  areaChartLinear: function (domSelector, dimension, group, yAxisLabel, valueAccessor, min, max) {
    if (valueAccessor === undefined) {
      valueAccessor = function (d) {
        return d.value;
      };
    }

    if (min === undefined) {
      min = 1;
    }

    if (max === undefined) {
      max = 12;
    }

    var _dim = this.getNormElemSize(domSelector);
    var _width = _dim.w;

    return dc.lineChart(domSelector)
          .transitionDuration(0)
          .width(_width)
          .height(Math.round(_width * 0.75))
          .x(d3.scale.linear()
              .domain([1, 12]))
          .margins({
            left: 60,
            top: 10,
            right: 10,
            bottom: 20
          })
          .renderArea(true)
          .brushOn(true)
          .clipPadding(10)
          .yAxisLabel(yAxisLabel)
          .dimension(dimension)
          .group(group, 'Planned')
          .valueAccessor(valueAccessor)
          .render();
  },

  /**
   * Create an area chart with a time x-Axis
   *
   * @param {string} domSelector
   * @param {crossfilter.dimension} dimension
   * @param {crossfilter.group} group
   * @param {string} yAxisLabel
   * @param {function} valueAccessor A function that receives a data object as a parameter
   *   and that should return a single value
   * @return {dc.chart} A chart object from dc.js
   */
  areaChartTime: function (domSelector, dimension, group, yAxisLabel, valueAccessor) {
    var _dim = this.getNormElemSize(domSelector);
    var _width = _dim.w;

    return dc.lineChart(domSelector)
          .transitionDuration(0)
          .width(_width)
          .height(Math.round(_width * 0.75))
          .x(d3.scale.linear()
              .domain([1, 12]))
          .margins({
            left: 60,
            top: 10,
            right: 10,
            bottom: 20
          })
          .renderArea(true)
          .brushOn(true)
          .clipPadding(10)
          .yAxisLabel(yAxisLabel)
          .dimension(dimension)
          .group(group, 'Planned')
          .valueAccessor(valueAccessor)
          .render();
  },

  /**
   * Create an oridinal bar chart
   *
   * @param {string} domSelector
   * @param {crossfilter.dimension} dim
   * @param {crossfilter.group} group
   * @param {object} [options]
   * @return {dc.chart} A dc.js chart object
   */
  barChartOrdinal: function (domSelector, dim, group, options) {
    var chartOptions = {
      aspectRatio: 0.66
    };
    var _options = {};

    $.extend(true, _options, this.options, chartOptions, options);

    var _size = this.getNormElemSize(domSelector, _options.minHeight);

    var _width = _size.w;

    var _height = _size.h;

    var chart = dc.barChartOrdinal(domSelector);

    _options.legendWidth = _width;
    _options.legendItemWidth = _width;

    if (!options.colors) {
      _options.colors = dc.statColorScales.google();
    }

    if (_options.valueAccessor !== undefined) {
      chart.valueAccessor(_options.valueAccessor);
    }

    if (_options.valueLabelFormat !== undefined) {
      chart.valueLabelFormat(_options.valueLabelFormat);
    }

    if (_options.xAxisLabelFormat !== undefined) {
      chart.xAxisLabelFormat(_options.xAxisLabelFormat);
    }

    if (_options.chartConfig.xAxisLabelPadding) {
      _options.margins.bottom += _options.chartConfig.xAxisLabelPadding;
    }

    if (_options.chartConfig.yAxisLabelPadding) {
      _options.margins.left += _options.chartConfig.yAxisLabelPadding;
    }

    chart
          .transitionDuration(0)
          .width(_width)
          .height(_height)
          .dimension(dim)
          .group(group)
          .colors(_options.colors)
          .xAxisLabel(_options.chartConfig.xAxisLabel)
          .yAxisLabel(_options.chartConfig.yAxisLabel)
          .margins(_options.margins);

    if ($.isFunction(_options.ordering)) {
      chart.ordering(_options.ordering);
    }

    if ($.isFunction(_options.seriesSort)) {
      chart.seriesSort(_options.seriesSort);
    }

      // overwrite legendables function
    chart.legendables = function () {
      return group.map(function (d) {
        return {
          name: d.key[0],
          color: _options.colors(d.key[0]),
          chart: chart
        };
      });
    };

    if (_options.legend) {
      dc.statLegend.legend(chart, _options);
    }

    chart.render();

    if (_options.chartConfig.yAxisLabelAngle != null &&
      _options.chartConfig.yAxisLabelOffsetX != null &&
      _options.chartConfig.yAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.y g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.yAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.yAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.yAxisLabelAngle + ')');
    }

    if (_options.chartConfig.xAxisLabelAngle != null &&
      _options.chartConfig.xAxisLabelOffsetX != null &&
      _options.chartConfig.xAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.x g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.xAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.xAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.xAxisLabelAngle + ')')
              .style('text-anchor', 'end');
    }
    return chart;
  },

  /**
   * Adds a year filter to filter areas (reloads page)
   *
   * @param {string} domSelector
   * @param {number} from
   * @param {number} to
   * @param {crossfilter.dimension[]} dims
   * @param {function} callback
   */
  dropdownFilterYear: function (
      domSelector,
      from,
      to,
      dims,
      callback) {
    var controlId = 'ddf' + this.objectId++;
    var select = $('<select/>')
          .attr('id', controlId)
          .addClass('form-control');
    var label = $('<label/>')
          .attr('for', controlId)
          .text('Filter by year');
    for (var i = from; i <= to; i++) {
      var o = $('<option/>')
              .attr('value', i)
              .text(i);
      select.append(o);
    }

      // Add change event
    select.on('change', function () {
      var e = $(this);
      var value = e.val();
      callback(value);
    });
    $(domSelector)
          .append(label)
          .append(select)
          .addClass('form-group');
  },

  numberDisplay: function (domSelector, group, options) {
    var _options = {
      valueAccessor: function (d) {
        if (d !== undefined) {
          return d.value;
        } else {
          return null;
        }
      },
      html: {
        one: '%number',
        some: '%number',
        none: '-'
      },
      formatNumber: d3.format('0.000')
    };

    if (options !== undefined) {
      $.extend(_options, options);
    }

    var chart = dc.numberDisplay(domSelector)
          .group(group)
          .html(_options.html)
          .valueAccessor(_options.valueAccessor)
          .formatNumber(_options.formatNumber);
    return chart.render();
  },

  /**
   * Create a line chart with series
   *
   * @param {string} domSelector
   * @param {crossfilter.dimension} dim A dimension on an array where the first element
   *   is the series name and the second is the key (x) value
   * @param {crossfilter.group} group A group value on the dimension
   * @param {string} yAxisLabel
   * @param {string} xAxisLabel
   * @returns {dc.chart};
   */
  seriesLineChart: function (domSelector, dim, group, options) {
    var chartOptions = {
      aspectRatio: 1,
      yAxisTickFormat: d3.format('d'),
      childOptions: {
        xyTipsOn: true,
        renderDataPoints: {}
      }
    };

    var _options = {};
    $.extend(true, _options, this.options, chartOptions, options);

    var _dim = this.getNormElemSize(domSelector);
    var _width = _dim.w;
    var _height = _dim.h;
    var _refLine = _options.chartConfig.refLine;
    var _refLineText = _options.chartConfig.refLineText;
    var _refLineAllign = _options.chartConfig.refLineAllign;

    _options.legendItemWidth = _width;
    _options.legendWidth = _width;

    var chart = dc.seriesChart(domSelector);

    if (_options.chartConfig.xAxisLabelPadding) {
      _options.margins.bottom += _options.chartConfig.xAxisLabelPadding;
    }

    if (_options.chartConfig.yAxisLabelPadding) {
      _options.margins.left += _options.chartConfig.yAxisLabelPadding;
    }

    chart
          .transitionDuration(0)
          .width(_width)
          .height(_height)
          .colors(dc.statColorScales.google())
          .x(_options.x)
          .xUnits(_options.xUnits)
          .brushOn(false)
          .yAxisPadding(-1)
          .yAxisLabel(_options.chartConfig.xAxisLabel)
          .xAxisLabel(_options.chartConfig.yAxisLabel)
          .clipPadding(10)
          ._rangeBandPadding(1)
          .dimension(dim)
          .margins(_options.margins)
          .group(group)
          .mouseZoomable(false)
          .seriesAccessor(_options.seriesAccessor)
          .keyAccessor(_options.keyAccessor)
          .valueAccessor(_options.valueAccessor);

    if (_refLine || _refLine === 0) {
      this.referenceLine(chart, _refLine, _refLineText, _refLineAllign);
    }

    //let max = _options.chartConfig.yAxisMaxValue;
    //let min = _options.chartConfig.yAxisMinValue || 0;
    var max = _options.chartConfig.yAxisMaxValue;
    var min = _options.chartConfig.yAxisMinValue || 0;
    dim.filter(function (t) {
      if (max === undefined) {
        max = t[2];
      }
      if (min === undefined) {
        min = t[2];
      }
      max = t[2] > max ? t[2] : max;
      min = t[2] < min ? t[2] : min;
    });
    chart.y(d3.scale.linear().domain([min, max]));

    if (_options.ordering) {
      chart.ordering(_options.ordering);
    }

    if (_options.valueSort) {
      chart.valueSort(_options.valueSort);
    }

    if (_options.childOptions) {
      chart.childOptions(_options.childOptions);
    }

    if (_options.yAxisTickFormat !== undefined) {
      chart.yAxis().tickFormat(_options.yAxisTickFormat);
    }

    if (_options.seriesSort !== undefined) {
      chart.seriesSort(_options.seriesSort);
    }

    if (_options.legend) {
          // Render populates legendables
      chart.render();

      chart.legendables = function () {
        var _items = [];
        var _children = chart.children();
        var i;

        for (i = 0; i < _children.length; i++) {
          var _child = _children[i];

          if (chart.shareColors()) {
            _child.colors(chart.colors());
          }

          _child.stack().every(function (item) {
            _items.push(_child.legendables()[0]);
          });
        };

        return _items;
      };

      dc.statLegend.legend(chart, _options);
    }

    chart.render();

    if (_options.chartConfig.yAxisLabelAngle != null &&
      _options.chartConfig.yAxisLabelOffsetX != null &&
      _options.chartConfig.yAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.y g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.yAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.yAxisLabelOffsetY) + ')' +
                ' rotate(' + (_options.chartConfig.yAxisLabelAngle) + ')');
    }

    if (_options.chartConfig.xAxisLabelAngle != null &&
      _options.chartConfig.xAxisLabelOffsetX != null &&
      _options.chartConfig.xAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.x g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.xAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.xAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.xAxisLabelAngle + ')')
              .style('text-anchor', 'end');
    }

    chart.getOptions = function () {
      return _options;
    };

    chart.getWidth = function () {
      return _width;
    };

    chart.getHeight = function () {
      return _height;
    };

    return chart;
  },

  /**
   * Format a number with thousand separator
   */
  currencyFormat: d3.format('0.000'),

  /**
   * Normalize the size of a dashboard graphic
   *
   * @param  {Number} width               The current width
   * @param  {Number} height              The current height
   * @param  {Number} minHeight           The minimum height of the element in pixels
   * @param  {Number} maxHeightFract      The current height
   * @return {Object}             An object with two properties w (width) and h (height)
   */
  sizeIt: function (width, height, minHeight, maxHeightFract) {
    if (minHeight === undefined) {
      console.debug('Missing parameter minHeight for this.sizeIt function');
    }

    if (maxHeightFract === undefined) {
      console.debug('Missing parameter maxHeightFract for this.sizeIt function');
    }

    var _winH = $(window).height();

    if (height > (_winH * maxHeightFract)) {
      height = (_winH * maxHeightFract);
    }

    if (height < minHeight) {
      height = minHeight;
    }

    return {
      w: width,
      h: height
    };
  },

  getNormElemSize: function (domSelector, minHeight, maxHeightFract) {
    if (maxHeightFract === undefined) {
      maxHeightFract = 0.33;
    }

    if (minHeight === undefined) {
      minHeight = 250;
    }

    var _elem = $(domSelector);
    return {
      w: _elem.parent().width(),
      h: _elem.parent().height()
    };
  },

  /**
   * Create a gauge chart
   *
   * @param {String} domSelector A DOM selector
   * @param {crossfilter.group} group A crossfilter group object
   * @param {Object} options A configuration object
   * @return {dc.chart} A dc.chart object
   */
  gaugeChart: function (domSelector, group, options) {
    var chartOptions = {
      'minHeight': 150,
      'maxHeightFract': 0.25,
      'aspectRatio': 0.66,
      'unitType': '',
      'dataValueFormat': ',.2f',
      range: [80, 100]
    };
    var _options = {};

    $.extend(true, _options, this.options, chartOptions, options);

    var _size = this.getNormElemSize(domSelector, _options.minHeight, _options.maxHeightFract);

    var _width = _size.w;
    var _height = _size.h;

      // Gauge containers should always be square
    if (_width > _height) {
      _width = _height;
    } else {
      _height = _width;
    }

    var chart = dc.gaugeChart(domSelector);

    if (_options.valueAccessor !== undefined) {
      chart.valueAccessor(options.valueAccessor);
    }

    if (_options.dataValueFormat !== undefined) {
      chart.dataValueFormat(_options.dataValueFormat);
    }

    if (_options.unitType !== undefined) {
      chart.unitType(_options.unitType);
    }

    chart
          .transitionDuration(0)
          .group(group)
          .width(_width)
          .height(_height)
          .range(_options.range);

    return chart.render();
  },

  /**
   * Create a grouped bar chart diagram
   *
   * @param {String} domSelector A DOM selector for where you want to place your diagram, i.e. #chart1
   * @param {crossfilter.dimension} dim A crossfilter dimension
   * @param {crossfilter.group} group A crossfilter group
   * @param {Object} options An object with extended options for rendering the diagram
   * @return {dc.chart} A dc.chart object
   */
  rowChart: function (domSelector, dim, group, options) {
    var chartOptions = {
      aspectRatio: 0.66
    };
    var _options = {};

    $.extend(true, _options, this.options, chartOptions, options);

    var _size = this.getNormElemSize(domSelector, _options.minHeight);

    var _width = _size.w;

    var _height = _size.h;

    var chart = dc.rowChart(domSelector);

    if (_options.valueAccessor !== undefined) {
      chart.valueAccessor(_options.valueAccessor);
    }

    if (_options.valueLabelFormat !== undefined) {
      chart.valueLabelFormat(_options.valueLabelFormat);
    }

    if (_options.xAxisLabelFormat !== undefined) {
      chart.xAxisLabelFormat(_options.xAxisLabelFormat);
    }

    chart
          .transitionDuration(0)
          .width(_width)
          .height(_height)
          .dimension(dim)
          .group(group)
          .xAxisLabel(_options.xAxisLabel)
          .yAxisLabel(_options.yAxisLabel)
          .margins(_options.margins);

    if ($.isFunction(_options.ordering)) {
      chart.ordering(_options.ordering);
    }

    if ($.isFunction(_options.seriesSort)) {
      chart.seriesSort(_options.seriesSort);
    }

    return chart.render();
  },

  /**
   * Create a grouped bar chart diagram
   *
   * @param {String} domSelector A DOM selector for where you want to place your diagram, i.e. #chart1
   * @param {crossfilter.dimension} dim A crossfilter dimension
   * @param {crossfilter.group} group A crossfilter group
   * @param {Object} options An object with extended options for rendering the diagram
   * @return {dc.chart} A dc.chart object
   */
  groupedStackedRowChart: function (domSelector, dim, group, options) {
    var chartOptions = {
      aspectRatio: 0.66
    };
    var _options = {};

    $.extend(true, _options, this.options, chartOptions, options);

    var _size = this.getNormElemSize(domSelector, _options.minHeight);

    var _width = _size.w;

    var _height = _size.h;

    var chart = dc.groupedStackedRowChart(domSelector);

    _options.legendWidth = _width;
    _options.legendItemWidth = _width;

    if (!options.colors) {
      _options.colors = dc.statColorScales.google();
    }

    if (_options.valueAccessor !== undefined) {
      chart.valueAccessor(_options.valueAccessor);
    }

    if (_options.valueLabelFormat !== undefined) {
      chart.valueLabelFormat(_options.valueLabelFormat);
    }

    if (_options.xAxisLabelFormat !== undefined) {
      chart.xAxisLabelFormat(_options.xAxisLabelFormat);
    }

    if (_options.chartConfig.xAxisLabelPadding) {
      _options.margins.bottom += _options.chartConfig.xAxisLabelPadding;
    }

    if (_options.chartConfig.yAxisLabelPadding) {
      _options.margins.left += _options.chartConfig.yAxisLabelPadding;
    }

    chart
          .transitionDuration(0)
          .width(_width)
          .height(_height)
          .dimension(dim)
          .group(group)
          .colors(_options.colors)
          .xAxisLabel(_options.chartConfig.xAxisLabel)
          .yAxisLabel(_options.chartConfig.yAxisLabel)
          .margins(_options.margins);

    if ($.isFunction(_options.ordering)) {
      chart.ordering(_options.ordering);
    }

    if ($.isFunction(_options.seriesSort)) {
      chart.seriesSort(_options.seriesSort);
    }

      // overwrite legendables function
    chart.legendables = function () {
      return group.map(function (d) {
        return {
          name: d.key[0],
          color: _options.colors(d.key[0]),
          chart: chart
        };
      });
    };

    if (_options.legend) {
      dc.statLegend.legend(chart, _options);
    }

    chart.render();

    if (_options.chartConfig.yAxisLabelAngle != null &&
      _options.chartConfig.yAxisLabelOffsetX != null &&
      _options.chartConfig.yAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.y g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.yAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.yAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.yAxisLabelAngle + ')');
    }

    if (_options.chartConfig.xAxisLabelAngle != null &&
      _options.chartConfig.xAxisLabelOffsetX != null &&
      _options.chartConfig.xAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.x g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.xAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.xAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.xAxisLabelAngle + ')')
              .style('text-anchor', 'end');
    }
    return chart;
  },

  /**
   * Create a grouped bar chart diagram
   *
   * @param {String} domSelector A DOM selector for where you want to place your diagram, i.e. #chart1
   * @param {crossfilter.dimension} dim A crossfilter dimension
   * @param {crossfilter.group} group A crossfilter group
   * @param {Object} options An object with extended options for rendering the diagram
   * @return {dc.chart} A dc.chart object
   */
  groupedRowChart: function (domSelector, dim, group, options) {
    var chartOptions = {
      'minHeight': 300,
      'aspectRatio': 0.66
    };

    var _options = {
      'colors': dc.statColorScales.google(),
      'highlightVariables': [],
      'highlightColor': '#ff0000'
    };

    $.extend(true, _options, this.options, chartOptions, options);

    var _size = this.getNormElemSize(domSelector, _options.minHeight);

    var _width = _size.w;

    var _height = _size.h;

    _options.legendWidth = _width;
    _options.legendItemWidth = _height;

    var chart = dc.groupedRowChart(domSelector);

    if (_options.valueAccessor !== undefined) {
      chart.valueAccessor(_options.valueAccessor);
    }

    if (_options.valueLabelFormat !== undefined) {
      chart.valueLabelFormat(_options.valueLabelFormat);
    }

    if (_options.xAxisLabelFormat !== undefined) {
      chart.xAxisLabelFormat(_options.xAxisLabelFormat);
    }

    if (_options.chartConfig.xAxisLabelPadding) {
      _options.margins.bottom += _options.chartConfig.xAxisLabelPadding;
    }

    if (_options.chartConfig.yAxisLabelPadding) {
      _options.margins.left += _options.chartConfig.yAxisLabelPadding;
    }

    chart
          .transitionDuration(0)
          .width(_width)
          .height(_height)
          .dimension(dim)
          .group(group)
          .yAxisMinValue(_options.chartConfig.yAxisMinValue)
          .yAxisMaxValue(_options.chartConfig.yAxisMaxValue)
          .xAxisLabel(_options.chartConfig.xAxisLabel)
          .yAxisLabel(_options.chartConfig.yAxisLabel)
          .margins(_options.margins)
          .colors(_options.colors)
          .highlightColor(_options.highlightColor)
          .highlightVariables(_options.highlightVariables)
          .renderTitle(true);

    chart.sortArray = _options.sortArray;

    if ($.isFunction(_options.ordering)) {
      chart.ordering(_options.ordering);
    }

    if ($.isFunction(_options.seriesSort)) {
      chart.seriesSort(_options.seriesSort);
    }

    if (_options.legend) {
      chart.legendables = function () {
        var _items = [];
        var _children = chart.children();
        var i;

        for (i = 0; i < _children.length; i++) {
          var _child = _children[i];

          if (chart.shareColors()) {
            _child.colors(chart.colors());
          }

          var order = _child.stack().values().next().value.values[0].data.key[4];
          _items[order - 1] = _child.legendables()[0];
        };

        return _items;
      };
      dc.statLegend.legend(chart, _options, true);
    }

    chart.render();

    if (_options.chartConfig.yAxisLabelAngle != null &&
      _options.chartConfig.yAxisLabelOffsetX != null &&
      _options.chartConfig.yAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.y g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.yAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.yAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.yAxisLabelAngle + ')');
    }

    if (_options.chartConfig.xAxisLabelAngle != null &&
      _options.chartConfig.xAxisLabelOffsetX != null &&
      _options.chartConfig.xAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.x g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.xAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.xAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.xAxisLabelAngle + ')')
              .style('text-anchor', 'end');
    }
    return chart;
  },

  /**
   * Create a grouped bar chart
   *
   * @param  {String} domSelector A DOM selector including the dot (.) or hash (#), i.e. #chart1
   * @param  {crossfilter.dimension} dim  crossfilter dimension
   * @param  {crissfilter.group} group A crossfilter group
   * @param  {Object} options On object of options that will be copied onto the chart
   * @return {dc.chart} A dc.chart object
   */
  stackedBarChart: function (domSelector, dim, group, options) {
    var chartOptions = {
      'minHeight': 300,
      'aspectRatio': 0.66,
      yAxisTickFormat: d3.format('d')
    };

    var _options = {};

    $.extend(true, _options, this.options, chartOptions, options);

    var _size = this.getNormElemSize(domSelector, _options.minHeight);

    var _width = _size.w;

    var _height = _size.h;

    var chart = dc.stackedBarChart(domSelector);

    if (_options.valueAccessor !== undefined) {
      chart.valueAccessor(_options.valueAccessor);
    }

    chart
          .transitionDuration(0)
          .width(_width)
          .height(_height)
          .dimension(dim)
          .group(group)
          .xAxisLabel(_options.xAxisLabel)
          .yAxisLabel(_options.yAxisLabel)
          .margins(_options.margins);

    if (_options.yAxisTickFormat !== undefined) {
      chart.yAxisLabelFormat(_options.yAxisTickFormat);
    }

    if ($.isFunction(_options.ordering)) {
      chart.ordering(_options.ordering);
    }

    if ($.isFunction(_options.seriesSort)) {
      chart.seriesSort(_options.seriesSort);
    }

    if (_options.legend) {
      console.log('Render legends to legendDiv');
    }

    return chart.render();
  },

  /**
   * Create a grouped bar chart
   *
   * @param  {String} domSelector A DOM selector including the dot (.) or hash (#), i.e. #chart1
   * @param  {crossfilter.dimension} dim  crossfilter dimension
   * @param  {crissfilter.group} group A crossfilter group
   * @param  {Object} options On object of options that will be copied onto the chart
   * @return {dc.chart} A dc.chart object
   */
  groupedBarChart: function (domSelector, dim, group, options) {
    var chartOptions = {
      'aspectRatio': 0.66,
      'xAxisTitle': '',
      'yAxisTitle': '',
      yAxisTickFormat: d3.format('d'),
      legend: false,
      autoItemWidth: false,
      legendItemHeight: 15,
      legendGap: 5,
      colors: dc.statColorScales.google(),
      horizontalLegend: true,
      highlightVariables: [],
      highlightColor: '#ff0000'
    };
    var _options = {};

    $.extend(true, _options, this.options, chartOptions, options);

    var _size = this.getNormElemSize(domSelector, _options.minHeight);

    var _width = _size.w;

    var _height = _size.h;

    _options.legendWidth = _width;
    _options.legendItemWidth = _width;

    var _refLine = _options.chartConfig.refLine;
    var _refLineText = _options.chartConfig.refLineText;
    var _refLineAllign = _options.chartConfig.refLineAllign;

    var chart = dc.groupedBarChart(domSelector);

    if (_options.valueAccessor !== undefined) {
      chart.valueAccessor(_options.valueAccessor);
    }

    if (_options.chartConfig.xAxisLabelPadding) {
      _options.margins.bottom += _options.chartConfig.xAxisLabelPadding;
    }

    if (_options.chartConfig.yAxisLabelPadding) {
      _options.margins.left += _options.chartConfig.yAxisLabelPadding;
    }

    chart
          .transitionDuration(0)
          .width(_width)
          .height(_height)
          .dimension(dim)
          .group(group)
          .xAxisLabel(_options.chartConfig.xAxisLabel)
          .yAxisLabel(_options.chartConfig.yAxisLabel)
          .yAxisMinValue(_options.chartConfig.yAxisMinValue)
          .yAxisMaxValue(_options.chartConfig.yAxisMaxValue)
          .margins(_options.margins)
          .colors(_options.colors)
          .highlightColor(_options.highlightColor)
          .highlightVariables(_options.highlightVariables);

    if (_refLine) {
      this.referenceLine(chart, _refLine, _refLineText, _refLineAllign);
    }

    if (_options.yAxisTickFormat !== undefined) {
      chart.yAxisLabelFormat(_options.yAxisTickFormat);
    }

    if ($.isFunction(_options.ordering)) {
      chart.ordering(_options.ordering);
    }

    if ($.isFunction(_options.seriesSort)) {
      chart.seriesSort(_options.seriesSort);
    }

    if (_options.legend) {
      dc.statLegend.legend(chart, _options, true);
    }

    chart.sortArray = _options.sortArray;

    chart.render();

    if (_options.chartConfig.yAxisLabelAngle != null &&
      _options.chartConfig.yAxisLabelOffsetX != null &&
      _options.chartConfig.yAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.y g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.yAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.yAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.yAxisLabelAngle + ')');
    }

    if (_options.chartConfig.xAxisLabelAngle != null &&
      _options.chartConfig.xAxisLabelOffsetX != null &&
      _options.chartConfig.xAxisLabelOffsetY != null) {
      chart.selectAll('g.axis.x g.tick text')
              .attr('transform', 'translate(' + this.scaleWidth(_width, _options.chartConfig.xAxisLabelOffsetX) +
                ',' + this.scaleHeight(_height, _options.chartConfig.xAxisLabelOffsetY) + ')' +
                ' rotate(' + _options.chartConfig.xAxisLabelAngle + ')')
              .style('text-anchor', 'end');
    }

    return chart;
  },

  /**
   * Create an oridinal pie chart
   *
   * @param {string} domSelector
   * @param {crossfilter.dimension} dim
   * @param {crossfilter.group} group
   * @param {object} [options={}] Any diagram specific options
   * @return {dc.chart} A chart object from dc.js
   */
  pieChart: function (domSelector, dim, group, options) {
    var _dim = this.getNormElemSize(domSelector);
    var _width = _dim.w;
    var _height = _dim.h;

    var _radius = Math.min(_width, _height) / 2;

    var chartOptions = {
      labelAccessor: function (d) {
        return d.value;
      },
      legend: false,
      legendLines: 1,
      legendItemWidth: _width,
      autoItemWidth: true,
      legendWidth: _width,
      externalRadiusPadding: 50,
      innerRadius: 25,
      horizontalLegend: true,
      legendGap: 5,
      legendItemHeight: 15
    };
    var _options = {};

    $.extend(true, _options, this.options, chartOptions, options);

    var chart = dc.pieChart(domSelector)
          .transitionDuration(0)
          .radius(_radius)
          .width(_width)
          .colors(dc.statColorScales.google())
          .slicesCap(8)
          .innerRadius(_options.innerRadius)
          .externalRadiusPadding(_options.externalRadiusPadding)
          .drawPaths(true)
          .dimension(dim)
          .renderLabel(true)
          .label(_options.labelAccessor)
          .valueAccessor(_options.valueAccessor)
          .group(group);

    if (_options.ordering !== undefined) {
      chart.ordering(_options.ordering);
    }

    chart.legendHighlight = function () {};

    chart.data(function (g) {
      var tmp = g
              .all();

      tmp = tmp.sort(function (a, b) {
        var av = chart.ordering()(a);
        var bv = chart.ordering()(b);

        if (av > bv) {
          return 1;
        } else if (av < bv) {
          return -1;
        } else {
          return 0;
        }
      });

      return tmp;
    });

    if (_options.legend) {
      chart.legendables = function () {
        var tmpData = group.all().slice();
        var items = [];
        var i;

        for (i = 0; i < tmpData.length; i++) {
          var item = tmpData[i];
          items[item.key[1] - 1] = {
            name: item.key[0],
            color: _options.colors(item.key[0]),
            chart: chart
          };
        }
        return items;
      };
      dc.statLegend.pieLegend(chart, _options);
    }

    return chart.render();
  }
};