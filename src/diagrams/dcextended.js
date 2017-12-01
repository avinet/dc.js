  dc.barChartOrdinal = function (parent, chartGroup) {
    var _chart = dc.marginMixin(dc.baseMixin({}));
    var _g;
    var xScale;
    var yScale;
    var _xAxisLabel;
    var _yAxisLabel;
    var _colors;
  
    // Set standard margins
    _chart.margins().top = 20;
    _chart.margins().right = 20;
    _chart.margins().bottom = 40;
    _chart.margins().left = 40;
  
    var buildOut = function () {
      var offsets = {};
      return function (d, y0, y) {
        var current = offsets[d.x];
        if (!current) {
          current = [0, 0];
        }
        if (y >= 0) {
          d.y0 = current[0];
          d.y = y;
          current[0] += y;
        } else {
          d.y0 = current[1] + y;
          d.y = y;
          current[1] += y;
        }
  
        offsets[d.x] = current;
      };
    };
  
    _chart.colors = function (colors) {
      _colors = colors;
      return _chart;
    };
  
    _chart.data(function (group) {
      var dataset = group.map(function (d) {
        return d.key[1].map(function (o, i) {
                // Structure it so that your numeric
                // axis (the stacked amount) is y
          return {
            x: o.title,
            y: o.value,
            z: d.key[0]
          };
        });
      });
      var stack = d3.layout.stack().out(buildOut());
  
      stack(dataset);
  
      dataset = dataset.map(function (group) {
        return group.map(function (d) {
                  // Invert the x and y values, and y0 becomes x0
          return {
            x: d.y,
            y: d.x,
            x0: d.y0,
            z: d.z
          };
        });
      });
  
      return dataset;
    });
  
    _chart.label(function (d) {
      return dc.utils.printSingleValue(d.x0 + d.x);
    }, false);
  
    _chart._doRender = function () {
      _chart.resetSvg();
      _g = _chart.svg();
      drawChart();
      return _chart;
    };
  
    _chart._doRedraw = function () {
      var data = _chart.data();
      updateValues(data);
      return _chart;
    };
  
    _chart.xAxisLabel = function (title) {
      _xAxisLabel = title;
      return _chart;
    };
  
    _chart.yAxisLabel = function (title) {
      _yAxisLabel = title;
      return _chart;
    };
  
    function updateValues (_chartData) {
      var _chartHeight = _chart.height() - _chart.margins().top - _chart.margins().bottom;
  
      _g.selectAll('rect')
              .transition()
              .duration(_chart.transitionDuration())
              .attr('y', function (d) {
                return yScale(d.x0 + Math.abs(d.x));
              })
              .attr('height', function (d) {
                return yScale(d.x0) - yScale(d.x0 + Math.abs(d.x));
              });
  
          // move x-axis text to the bottom of the chart
      _g
              .selectAll('.x.axis text')
              .attr('dy', _chartHeight - yScale(0));
    }
  
    function drawChart () {
          // Get your data
      var data = _chart.data();
      var margins = _chart.margins();
      var height = _chart.height();
      var width = _chart.width();
      var _colorScale = _colors;
      var _chartWidth = _chart.width() - _chart.margins().left - _chart.margins().right;
      var _chartHeight = _chart.height() - _chart.margins().top - _chart.margins().bottom;
  
      _chart.title(function (d) {
        return d.z;
      });
  
      // Put all drawing methods here
      var _chartArea = _g
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
  
      var xMin = d3.min(data, function (group) {
        return d3.min(group, function (d) {
          return d.x0;
        });
      });
      var xMax = d3.max(data, function (group) {
        return d3.max(group, function (d) {
          return d.x + d.x0;
        });
      });
      var domain = data[0].map(function (d) {
        return d.y;
      });
  
      yScale = d3.scale.linear()
        .domain([xMax, xMin])
        .range([0, height - margins.top - margins.bottom]);
      xScale = d3.scale.ordinal()
        .domain(domain)
        .rangeRoundBands([0, width - margins.left - margins.right], 0.1);
  
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom');
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left');
  
      var chartGroup = _chartArea.selectAll('.chartGroup')
        .data(data)
        .enter()
        .append('g');
  
      chartGroup.selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .style('fill', function (d) {
          return _colorScale(d.z);
        })
        .attr('y', function (d) {
          return yScale(0);
        })
        .attr('x', function (d, i) {
          return xScale(d.y);
        })
        .attr('width', function (d) {
          return xScale.rangeBand();
        })
        .attr('height', function (d) {
          return 0;
        })
        .append('svg:title').text(function (d) {
          return d.z + ': ' + d.x;
        });
  
      // X axis title
      _chartArea.append('g')
        .attr('class', 'x-axis-label x-label')
        .append('text')
        .attr('x', -_chart.margins().right + (_chartWidth / 2))
        .attr('y', _chartHeight + _chart.margins().bottom - 10)
        .text(_xAxisLabel);
  
      // Y axis title
      _chartArea.append('g')
        .attr('class', 'y-axis-label y-label')
        .append('text')
        .attr('x', -(_chartHeight / 2))
        .attr('y', -_chart.margins().left + 15)
        .attr('transform', 'rotate(-90)')
        .text(_yAxisLabel);
  
      // Add axis
      _chartArea.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + yScale(0) + ')')
        .call(xAxis);
  
      _chartArea.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .selectAll('text')
        .attr('dy', '0.1em')
        .style('text-anchor', 'end');
  
      updateValues(data);
    }
  
    return _chart.anchor(parent, chartGroup);
  };
  
  /**
   * Concrete grouped bar chart implementation.
   *
   * @name groupedBarChart
   * @param {String|node|d3.selection} parent - Any valid
   * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
   * @return {dc.groupedBarChart}
   */
  dc.groupedBarChart = function (parent, chartGroup) {
    var _g;
  
    var _width = 100;
    var _height = 100;
  
    var _chartWidth = _width;
    var _chartHeight = _height;
  
    var _chart = dc.marginMixin(dc.baseMixin({}));
  
      // Set standard margins
    _chart.margins().top = 20;
    _chart.margins().right = 20;
    _chart.margins().bottom = 40;
    _chart.margins().left = 40;
  
    var _valueLabelFormat = d3.format(',.0f');
    var _yAxisLabelFormat = d3.format(',.0f');
    var _xAxisLabel;
    var _yAxisLabel;
    var _yAxisMinValue = 0;
    var _yAxisMaxValue;
    var _chartArea;
    var _chartData;
    var _groupNames;
    var _yScale;
    var _colors;
    var _highlightVariables = [];
    var _highlightColor = '#ff0000';
  
    _chart.highlightColor = function (highlightColor) {
      _highlightColor = highlightColor;
      return _chart;
    };
  
    _chart.highlightVariables = function (highlightVariables) {
      _highlightVariables = highlightVariables;
      return _chart;
    };
  
    var _seriesSort = function (d) {
      return d;
    };
  
    _chart.colors = function (colorFunction) {
      if ($.isFunction(colorFunction)) {
        _colors = colorFunction;
      }
      return _chart;
    };
  
    _chart.yAxisLabelFormat = function (labelFmt) {
      if (labelFmt !== undefined) {
        _yAxisLabelFormat = labelFmt;
      } else {
        return _yAxisLabelFormat;
      }
      return _chart;
    };
  
    _chart.yAxisMinValue = function (value) {
      if (value) {
        _yAxisMinValue = value;
      }
      return _chart;
    };
  
    _chart.yAxisMaxValue = function (value) {
      if (value) {
        _yAxisMaxValue = value;
      }
      return _chart;
    };
  
    var _valueAccessor = function (d) {
      return d.value;
    };
  
    _chart.valueAccessor = function (valueAccessor) {
      if (valueAccessor === undefined) {
        return _valueAccessor;
      } else {
        _valueAccessor = valueAccessor;
      }
      return _chart;
    };
  
    _chart.width = function (width) {
      if (width === undefined) {
        return _width;
      } else {
        _width = width;
      }
      return _chart;
    };
  
    _chart.height = function (height) {
      if (height === undefined) {
        return _height;
      } else {
        _height = height;
      }
      return _chart;
    };
  
    _chart.xAxisLabel = function (title) {
      _xAxisLabel = title;
      return _chart;
    };
  
    _chart.yAxisLabel = function (title) {
      _yAxisLabel = title;
      return _chart;
    };
  
    _chart.seriesSort = function (seriesSort) {
      if ($.isFunction(seriesSort)) {
        _seriesSort = seriesSort;
      } else {
        return _seriesSort;
      }
    };
  
    _chart.parseGroup = function (inputGroup) {
      var tmpObj = {};
      var keys = [];
      var subKeys = [];
      var _data = [];
  
      inputGroup.all()
              .map(function (d) {
                if (keys.indexOf(d.key[0]) === -1) {
                  keys.push(d.key[0]);
                }
                if (subKeys.indexOf(d.key[1]) === -1) {
                  subKeys.push(d.key[1]);
                }
                tmpObj[d.key[0]] = tmpObj[d.key[0]] || {};
                tmpObj[d.key[0]][d.key[1]] = {
                  value: _chart.valueAccessor()(d),
                  order: d.key[3]
                };
              });
  
      keys.map(function (key) {
        var group = {
          key: key,
          groupData: []
        };
  
        subKeys.map(function (subKey) {
          var item = tmpObj[key][subKey];
          group.groupData.push({
            name: subKey,
            value: item.value,
            order: item.order
          });
        });
  
        group.groupData.sort(function (a, b) {
          if (a.order > b.order) {
            return 1;
          } else if (a.order < b.order) {
            return -1;
          } else {
            return 0;
          }
        });
  
        _data.push(group);
      });
  
      if (_chart.sortArray) {
        var result = [];
        _chart.sortArray.forEach(function (key) {
          var found = false;
          _data = _data.filter(function (item) {
            if (!found && item.key === key) {
              result.push(item);
              found = true;
              return false;
            } else {
              return true;
            }
          });
        });
  
        _data = result;
      }
  
      return _data;
    };
  
    _chart.data(function (group) {
      return _chart.parseGroup(group);
    });
  
    function getChartData () {
      _chartData = _chart.data();
      if (_chartData.length > 0) {
        _groupNames = _chartData[0]
                  .groupData.map(function (d) {
                    return d.name;
                  });
      }
    }
  
    _chart._doRender = function () {
      _chart.resetSvg();
      _g = _chart.svg();
      drawChart();
      return _chart;
    };
  
    _chart._doRedraw = function () {
      getChartData();
      updateValues();
      return _chart;
    };
  
    function calculateMinMax () {
      _yAxisMinValue = _yAxisMinValue || 0;
      _yAxisMaxValue = _yAxisMaxValue || 0;
  
      var min = d3.min(_chartData, function (d) {
        return d3.min(d.groupData, function (d) {
          return d.value;
        });
      });
  
      var max = d3.max(_chartData, function (d) {
        return d3.max(d.groupData, function (d) {
          return d.value;
        });
      });
  
      if (min > _yAxisMinValue) {
        min = _yAxisMinValue;
      }
  
      if (max < _yAxisMaxValue) {
        max = _yAxisMaxValue;
      }
  
      return {
        min: min,
        max: max
      };
    }
  
    function updateValues () {
      var chartGroup2 = _chartArea.selectAll('.chartGroup')
              .data(_chartData);
  
      var domain = calculateMinMax();
  
      chartGroup2.selectAll('text')
              .data(function (d) {
                return d.groupData;
              })
              .text(function (d) {
                if (+d.value > 0) {
                  return _valueLabelFormat(+d.value);
                } else {
                  return '';
                }
              })
              .transition()
              .duration(_chart.transitionDuration())
              .attr('y', function (d) {
                return _yScale(Math.max(0, d.value));
              })
              .style('fill', '#000000');
  
      chartGroup2.selectAll('rect')
              .data(function (d) {
                return d.groupData;
              })
              .transition()
              .duration(_chart.transitionDuration())
              .attr('y', function (d) {
                return _yScale(Math.max(0, d.value));
              })
              .attr('height', function (d) {
                return Math.abs(_yScale(d.value - Math.max(0, domain.min)) - _yScale(0));
              });
  
      // move x-axis text to the bottom of the chart
      if (domain.min < 0) {
        _chartArea
          .selectAll('.x.axis text')
          .attr('dy', _yScale(0));
      }
    }
  
    function drawChart () {
      _chartWidth = _chart.width() - _chart.margins().left - _chart.margins().right;
  
      _chartHeight = _chart.height() - _chart.margins().top - _chart.margins().bottom;
  
          // Data here
      getChartData();
  
      var domain = calculateMinMax();
  
      if (_chartData.length === 0) {
        return;
      }
  
      var x0 = d3.scale.ordinal()
              .rangeRoundBands([0, _chartWidth], 0.15);
  
      var x1 = d3.scale.ordinal();
  
      _yScale = d3.scale.linear()
              .range([_chartHeight, 0]);
  
      _chart.y = function () {
        return function (value) {
          return _yScale(value);
        };
      };
  
      var color = _colors;
  
      var xAxis = d3.svg.axis()
              .scale(x0)
              .orient('bottom');
  
      var yAxis = d3.svg.axis()
              .scale(_yScale)
              .orient('left')
              .tickFormat(_yAxisLabelFormat);
  
      _chartArea = _g
              .attr('width', _chart.width())
              .attr('height', _chart.height())
              .append('g')
              .attr('class', 'chart-body')
              .attr('transform', 'translate(' + _chart.margins().left + ',' + _chart.margins().top + ')');
  
      x0.domain(_chartData.map(function (d) {
        return d.key;
      }));
  
      x1.domain(_groupNames)
              .rangeRoundBands([0,
                x0.rangeBand()
              ]);
  
      _yScale.domain([
        domain.min,
        domain.max
      ]);
  
      // X axis title
      _chartArea.append('g')
        .attr('class', 'x-axis-label x-label')
        .append('text')
        .attr('x', -_chart.margins().right + (_chartWidth / 2))
        .attr('y', _chartHeight + _chart.margins().bottom - 10)
        .text(_xAxisLabel);
  
      // Y axis title
      _chartArea.append('g')
        .attr('class', 'y-axis-label y-label')
        .append('text')
        .attr('x', -(_chartHeight / 2))
        .attr('y', -_chart.margins().left + 15)
        .attr('transform', 'rotate(-90)')
        .text(_yAxisLabel);
  
          // Add axis
      _chartArea.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + _yScale(Math.max(0, domain.min)) + ')')
        .call(xAxis);
  
      _chartArea.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text');
  
          // Add group bars
      var chartGroup = _chartArea.selectAll('.chartGroup')
        .data(_chartData)
        .enter()
        .append('g')
        .attr('class', 'chartGroup')
        .attr('transform', function (d) {
          return 'translate(' + x0(d.key) + ',0)';
        });
  
      chartGroup.selectAll('rect')
        .data(function (d) {
          for (var i = 0; i < d.groupData.length; i++) {
            d.groupData[i].key = d.key;
          }
          return d.groupData;
        })
        .enter()
        .append('rect')
        .style('fill', function (d) {
          if (_highlightVariables.indexOf(d.key) !== -1) {
            return _highlightColor;
          } else {
            return color(d.name);
          }
        })
        .attr('width', x1.rangeBand())
        .attr('x', function (d) {
          return x1(d.name);
        })
        .append('title')
        .text(function (d) {
          return d.name + ': ' + d.value;
        });
      updateValues();
    }
  
    return _chart.anchor(parent, chartGroup);
  };
  
  /**
   * Concrete grouped row chart implementation.
   *
   * @name groupedRowChart
   * @param {String|node|d3.selection} parent - Any valid
   * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
   * @return {dc.groupedRowChart}
   */
  dc.groupedRowChart = function (parent, chartGroup) {
    var _g;
  
    var _width = 100;
    var _height = 100;
  
    var _chartWidth = _width;
    var _chartHeight = _height;
  
    var _chart = dc.marginMixin(dc.baseMixin({}));
  
      // Set standard margins
    _chart.margins().top = 20;
    _chart.margins().right = 20;
    _chart.margins().bottom = 40;
    _chart.margins().left = 40;
  
    var _valueLabelFormat = d3.format(',.0f');
    var _xAxisLabelFormat = d3.format(',.0f');
    var _xAxisLabel;
    var _yAxisLabel;
    var _yAxisMinValue = 0;
    var _yAxisMaxValue;
    var _yScale1;
    var _yScale0;
    var _xAxis;
    var _yAxis;
    var _chartArea;
    var _chartData;
    var _colors;
    var _groupNames;
    var _xScale;
    var _highlightVariables = [];
    var _highlightColor = '#ff0000';
  
    var _seriesSort = function (d) {
      return d.name;
    };
  
    var _valueAccessor = function (d) {
      return d.value;
    };
  
    _chart.highlightVariables = function (highlightVariables) {
      _highlightVariables = highlightVariables;
      return _chart;
    };
  
    _chart.highlightColor = function (highlightColor) {
      _highlightColor = highlightColor;
      return _chart;
    };
  
    _chart.colors = function (colorScale) {
      if ($.isFunction(colorScale)) {
        _colors = colorScale;
      }
      return _chart;
    };
  
    _chart.seriesSort = function (seriesSortFunction) {
      if ($.isFunction(seriesSortFunction)) {
        _seriesSort = seriesSortFunction;
      } else {
        return _seriesSort;
      }
    };
  
    _chart.xAxisLabelFormat = function (d3FormatString) {
      if (d3FormatString !== undefined) {
        _xAxisLabelFormat = d3.format(d3FormatString);
      } else {
        return _xAxisLabelFormat;
      }
      return _chart;
    };
  
    _chart.valueLabelFormat = function (d3FormatString) {
      if (d3FormatString !== undefined) {
        _valueLabelFormat = d3.format(d3FormatString);
      } else {
        return _valueLabelFormat;
      }
      return _chart;
    };
  
    _chart.valueAccessor = function (valueAccessor) {
      if (valueAccessor === undefined) {
        return _valueAccessor;
      } else {
        _valueAccessor = valueAccessor;
      }
      return _chart;
    };
  
    _chart.width = function (width) {
      if (width === undefined) {
        return _width;
      } else {
        _width = width;
      }
      return _chart;
    };
  
    _chart.height = function (height) {
      if (height === undefined) {
        return _height;
      } else {
        _height = height;
      }
      return _chart;
    };
  
    _chart.xAxisLabel = function (title) {
      _xAxisLabel = title;
      return _chart;
    };
  
    _chart.yAxisLabel = function (title) {
      _yAxisLabel = title;
      return _chart;
    };
  
    _chart.yAxisMinValue = function (value) {
      if (value) {
        _yAxisMinValue = value;
      }
      return _chart;
    };
  
    _chart.yAxisMaxValue = function (value) {
      if (value) {
        _yAxisMaxValue = value;
      }
      return _chart;
    };
  
    _chart.parseGroup = function (inputGroup) {
      var tmpObj = {};
      var keys = [];
      var subKeys = [];
      var _data = [];
  
      inputGroup.all()
        .map(function (d) {
          if (keys.indexOf(d.key[0]) === -1) {
            keys.push(d.key[0]);
          }
          if (subKeys.indexOf(d.key[1]) === -1) {
            subKeys.push(d.key[1]);
          }
          tmpObj[d.key[0]] = tmpObj[d.key[0]] || {};
          tmpObj[d.key[0]][d.key[1]] = {
            value: _chart.valueAccessor()(d),
            order: d.key[3]
          };
        });
  
      keys.map(function (key) {
        var group = {
          key: key,
          groupData: []
        };
  
        subKeys.map(function (subKey) {
          var item = tmpObj[key][subKey];
          group.groupData.push({
            name: subKey,
            value: item.value,
            order: item.order
          });
        });
  
        group.groupData.sort(function (a, b) {
          if (a.order > b.order) {
            return 1;
          } else if (a.order < b.order) {
            return -1;
          } else {
            return 0;
          }
        });
  
        _data.push(group);
      });
  
      if (_chart.sortArray) {
        var result = [];
        _chart.sortArray.forEach(function (key) {
          var found = false;
          _data = _data.filter(function (item) {
            if (!found && item.key === key) {
              result.push(item);
              found = true;
              return false;
            } else {
              return true;
            }
          });
        });
  
        _data = result;
      }
  
      return _data;
    };
  
    _chart.data(function (group) {
      return _chart.parseGroup(group);
    });
  
    _chart._doRender = function () {
      _chart.resetSvg();
      _g = _chart.svg();
      drawChart();
      return _chart;
    };
  
    _chart._doRedraw = function () {
      getChartData();
      updateValues();
      return _chart;
    };
  
    function calculateMinMax () {
      _yAxisMinValue = _yAxisMinValue || 0;
      _yAxisMaxValue = _yAxisMaxValue || 0;
  
      var min = d3.min(_chartData, function (d) {
        return d3.min(d.groupData, function (d) {
          return d.value;
        });
      });
  
      var max = d3.max(_chartData, function (d) {
        return d3.max(d.groupData, function (d) {
          return d.value;
        });
      });
  
      if (min > _yAxisMinValue) {
        min = _yAxisMinValue;
      }
  
      if (max < _yAxisMaxValue) {
        max = _yAxisMaxValue;
      }
  
      return {
        min: min,
        max: max
      };
    }
  
    function updateValues () {
      var chartGroup2 = _chartArea.selectAll('.chartGroup')
              .data(_chartData);
  
      var domain = calculateMinMax();
  
      chartGroup2.selectAll('text')
        .data(function (d) {
          return d.groupData;
        })
        .text(function (d) {
          if (+d.value > 0) {
            return _valueLabelFormat(+d.value);
          } else {
            return '';
          }
        })
        .transition()
        .duration(_chart.transitionDuration())
        .attr('x', function (d) {
          return _xScale(Math.min(0, d.value));
        })
        .style('fill', '#000000');
  
      chartGroup2.selectAll('rect')
        .data(function (d) {
          return d.groupData;
        })
        .attr('width', function (d) {
          return Math.abs(_xScale(d.value) - _xScale(Math.max(0, domain.min)));
        });
  
      // move y-axis text to the left of the chart
      if (domain.min < 0) {
        _chartArea
          .selectAll('.y.axis text')
          .attr('dx', -_xScale(0));
      }
    }
  
    function getChartData () {
      _chartData = _chart.data();
      if (_chartData.length > 0) {
        _groupNames = _chartData[0]
                  .groupData.map(function (d) {
                    return d.name;
                  });
      }
    }
  
    function drawChart () {
      _chartWidth = _chart.width() - _chart.margins().left - _chart.margins().right;
  
      _chartHeight = _chart.height() - _chart.margins().top - _chart.margins().bottom;
  
      _yScale0 = d3.scale.ordinal()
        .rangeRoundBands([0, _chartHeight], 0.15);
  
      _yScale1 = d3.scale.ordinal();
  
      _xScale = d3.scale.linear()
        .range([0, _chartWidth]);
  
      _xAxis = d3.svg.axis()
        .scale(_xScale)
        .orient('bottom')
        .tickFormat(_xAxisLabelFormat);
  
      _yAxis = d3.svg.axis()
        .scale(_yScale0)
        .orient('left');
  
      _chartArea = _g
        .attr('width', _chart.width())
        .attr('height', _chart.height())
        .append('g')
        .attr('transform', 'translate(' + _chart.margins().left + ',' + _chart.margins().top + ')');
  
      // Data here
      getChartData();
  
      var domain = calculateMinMax();
  
      if (_chartData.length === 0) {
        return;
      }
  
      _yScale0.domain(_chartData.map(function (d) {
        return d.key;
      }));
  
      _yScale1.domain(_groupNames)
        .rangeRoundBands([0,
          _yScale0.rangeBand()
        ]);
  
      _xScale.domain([
        domain.min,
        domain.max
      ]);
  
      // X axis title
      _chartArea.append('g')
        .attr('class', 'x-axis-label x-label')
        .append('text')
        .attr('x', -_chart.margins().right + (_chartWidth / 2))
        .attr('y', _chartHeight + _chart.margins().bottom - 10)
        .text(_xAxisLabel);
  
      // Y axis title
      _chartArea.append('g')
        .attr('class', 'y-axis-label y-label')
        .append('text')
        .attr('x', -(_chartHeight / 2))
        .attr('y', -_chart.margins().left + 15)
        .attr('transform', 'rotate(-90)')
        .text(_yAxisLabel);
  
      // Add axis
      _chartArea.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + _chartHeight + ')')
        .call(_xAxis);
  
      _chartArea.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + _xScale(Math.max(0, domain.min)) + ',0)')
        .call(_yAxis)
        .selectAll('text')
        .attr('dy', '0em')
        .attr('transform', 'rotate(-90)')
        .style('text-anchor', 'end');
  
      // Add group bars
      var chartGroup = _chartArea.selectAll('.chartGroup')
        .data(_chartData)
        .enter()
        .append('g')
        .attr('class', 'chartGroup')
        .attr('transform', function (d) {
          return 'translate(0, ' + _yScale0(d.key) + ')';
        });
  
      chartGroup.selectAll('rect')
        .data(function (d) {
          for (var i = 0; i < d.groupData.length; i++) {
            d.groupData[i].key = d.key;
          }
          return d.groupData;
        })
        .enter()
        .append('rect')
        .style('fill', function (d) {
          if (_highlightVariables.indexOf(d.key) !== -1) {
            return _highlightColor;
          } else {
            return _colors(d.name);
          }
        })
        .attr('height', _yScale1.rangeBand())
        .attr('y', function (d) {
          return _yScale1(d.name);
        })
        .attr('width', function (d) {
          return 0;
        })
        .attr('x', function (d) {
          return _xScale(Math.min(0, d.value) + Math.max(0, domain.min));
        })
        .append('title')
        .text(function (d) {
          return d.name + ': ' + d.value;
        });
      updateValues();
    }
  
    return _chart.anchor(parent, chartGroup);
  };
  
  /**
   * Stacked grouped row chart implementation.
   *
   * @name groupedRowChart
   * @param {String|node|d3.selection} parent - Any valid
   * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
   * @return {dc.groupedRowChart}
   */
  dc.groupedStackedRowChart = function (parent, chartGroup) {
    var _chart = dc.marginMixin(dc.baseMixin({ animation: false }));
    var _g;
    var xScale;
    var yScale;
    var _xAxisLabel;
    var _yAxisLabel;
    var _colors;
  
    // Set standard margins
    _chart.margins().top = 20;
    _chart.margins().right = 20;
    _chart.margins().bottom = 40;
    _chart.margins().left = 40;
  
    var buildOut = function () {
      var offsets = {};
      return function (d, y0, y) {
        var current = offsets[d.x];
        if (!current) {
          current = [0, 0];
        }
        if (y >= 0) {
          d.y0 = current[0];
          d.y = y;
          current[0] += y;
        } else {
          d.y0 = current[1] + y;
          d.y = y;
          current[1] += y;
        }
  
        offsets[d.x] = current;
      };
    };
  
    _chart.colors = function (colors) {
      _colors = colors;
      return _chart;
    };
  
    _chart.xAxisLabel = function (title) {
      _xAxisLabel = title;
      return _chart;
    };
  
    _chart.yAxisLabel = function (title) {
      _yAxisLabel = title;
      return _chart;
    };
  
    _chart.data(function (group) {
      var dataset = group.map(function (d) {
        return d.key[1].map(function (o, i) {
                // Structure it so that your numeric
                // axis (the stacked amount) is y
          return {
            x: o.title,
            y: o.value,
            z: d.key[0]
          };
        });
      });
      var stack = d3.layout.stack().out(buildOut());
  
      stack(dataset);
  
      dataset = dataset.map(function (group) {
        return group.map(function (d) {
                  // Invert the x and y values, and y0 becomes x0
          return {
            x: d.y,
            y: d.x,
            x0: d.y0,
            z: d.z
          };
        });
      });
  
      return dataset;
    });
  
    _chart.label(function (d) {
      return dc.utils.printSingleValue(d.x0 + d.x);
    }, false);
  
    _chart._doRender = function () {
      _chart.resetSvg();
      _g = _chart.svg();
      drawChart();
      return _chart;
    };
  
    _chart._doRedraw = function () {
      var data = _chart.data();
      updateValues(data);
      return _chart;
    };
  
    function updateValues (_chartData) {
      _g.selectAll('rect')
        .transition()
        .duration(_chart.transitionDuration())
        .attr('x', function (d) {
          return xScale(d.x0);
        })
        .attr('width', function (d) {
          return Math.abs(xScale(d.x) - xScale(0));
        });
  
      // move y-axis text to the bottom of the chart
      _g
        .selectAll('.y.axis text')
        .attr('dx', -xScale(0));
    }
  
    function drawChart () {
      // Get your data
      var data = _chart.data();
      var margins = _chart.margins();
      var height = _chart.height();
      var width = _chart.width();
      var _colorScale = _colors;
      var _chartWidth = _chart.width() - _chart.margins().left - _chart.margins().right;
      var _chartHeight = _chart.height() - _chart.margins().top - _chart.margins().bottom;
  
      _chart.title(function (d) {
        return d.z;
      });
  
      // Put all drawing methods here
      var _chartArea = _g
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');
  
      var xMin = d3.min(data, function (group) {
        return d3.min(group, function (d) {
          return d.x0;
        });
      });
      var xMax = d3.max(data, function (group) {
        return d3.max(group, function (d) {
          return d.x + d.x0;
        });
      });
      var domain = data[0].map(function (d) {
        return d.y;
      });
  
      xScale = d3.scale.linear()
                  .domain([xMin, xMax])
                  .range([0, width - margins.left - margins.right]);
      yScale = d3.scale.ordinal()
                  .domain(domain)
                  .rangeRoundBands([0, height - margins.top - margins.bottom], 0.1);
  
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom');
  
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left');
  
      var chartGroup = _chartArea.selectAll('.chartGroup')
        .data(data)
        .enter()
        .append('g');
  
      chartGroup.selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .style('fill', function (d) {
          return _colorScale(d.z);
        })
        .attr('x', function (d) {
          return 0;
        })
            .attr('y', function (d, i) {
              return yScale(d.y);
            })
            .attr('height', function (d) {
              return yScale.rangeBand();
            })
            .attr('width', function (d) {
              return 0;
            })
        .append('svg:title').text(function (d) {
          return d.z + ': ' + d.x;
        });
  
      // X axis title
      _chartArea.append('g')
        .attr('class', 'x-axis-label x-label')
        .append('text')
        .attr('x', -_chart.margins().right + (_chartWidth / 2))
        .attr('y', _chartHeight + _chart.margins().bottom - 10)
        .text(_xAxisLabel);
  
      // Y axis title
      _chartArea.append('g')
        .attr('class', 'y-axis-label y-label')
        .append('text')
        .attr('x', -(_chartHeight / 2))
        .attr('y', -_chart.margins().left + 15)
        .attr('transform', 'rotate(-90)')
        .text(_yAxisLabel);
  
      // Add axis
      _chartArea.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (height - margins.top - margins.bottom) + ')')
        .call(xAxis);
  
      _chartArea.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + xScale(0) + ',0)')
        .call(yAxis)
        .selectAll('text')
        .attr('dy', '0em')
        .style('text-anchor', 'end');
  
      updateValues(data);
    }
  
    return _chart.anchor(parent, chartGroup);
  };
  
  dc.stackedRowChart = function (parent, chartGroup) {
    var _chart = dc.marginMixin(dc.baseMixin({}));
    var _g;
  
    // Set standard margins
    _chart.margins().top = 20;
    _chart.margins().right = 20;
    _chart.margins().bottom = 40;
    _chart.margins().left = 40;
  
    var buildOut = function () {
      var offsets = {};
      return function (d, y0, y) {
        var current = offsets[d.x];
        if (!current) {
          current = [0, 0];
        }
        if (y >= 0) {
          d.y0 = current[0];
          d.y = y;
          current[0] += y;
        } else {
          d.y0 = current[1] + y;
          d.y = y;
          current[1] += y;
        }
  
        offsets[d.x] = current;
      };
    };
  
    _chart.data(function (group) {
      // Do this first: Make copy of group data array
      var tmpData = group.all().slice();
  
      var dataset = tmpData.map(function (d) {
        return d.key[1].map(function (o, i) {
                // Structure it so that your numeric
                // axis (the stacked amount) is y
          return {
            x: o.title,
            y: o.value,
            z: d.key[0]
          };
        });
      });
      var stack = d3.layout.stack().out(buildOut());
  
      stack(dataset);
  
      dataset = dataset.map(function (group) {
        return group.map(function (d) {
                  // Invert the x and y values, and y0 becomes x0
          return {
            x: d.y,
            y: d.x,
            x0: d.y0,
            z: d.z
          };
        });
      });
  
      return dataset;
    });
  
    _chart._doRender = function () {
      _chart.resetSvg();
      _g = _chart.svg();
      drawChart();
      return _chart;
    };
  
    _chart._doRedraw = function () {
      return _chart;
    };
  
    function drawChart () {
      // Get your data
      var data = _chart.data();
      var height = _chart.height();
      var width = _chart.width();
  
      // Put all drawing methods here
      var _chartArea = _g
        .attr('width', _chart.width())
        .attr('height', _chart.height())
        .append('g')
        .attr('transform', 'translate(' + _chart.margins().left + ',' + _chart.margins().top + ')');
  
      var xMax = d3.max(data, function (group) {
        return d3.max(group, function (d) {
          return d.x + d.x0;
        });
      });
      var xScale = d3.scale.linear()
        .domain([0, xMax])
        .range([0, width]);
      var domain = data[0].map(function (d) {
        return d.y;
      });
      var yScale = d3.scale.ordinal()
        .domain(domain)
        .rangeRoundBands([0, height], 0.1);
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom');
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left');
      var colours = d3.scale.category10();
      var groups = _chartArea.selectAll('g')
        .data(data)
        .enter()
        .append('g')
        .style('fill', function (d, i) {
          return colours(i);
        });
      groups.selectAll('rect')
        .data(function (d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return xScale(d.x0);
        })
        .attr('y', function (d, i) {
          return yScale(d.y);
        })
        .attr('height', function (d) {
          return yScale.rangeBand();
        })
        .attr('width', function (d) {
          return xScale(d.x);
        })
        .on('mouseover', function (d) {
          var xPos = parseFloat(d3.select(this).attr('x')) / 2 + width / 2;
          var yPos = parseFloat(d3.select(this).attr('y')) + yScale.rangeBand() / 2;
  
          d3.select('#tooltip')
            .style('left', xPos + 'px')
            .style('top', yPos + 'px')
            .select('#value')
            .text(d.x);
  
          d3.select('#tooltip').classed('hidden', false);
        })
        .on('mouseout', function () {
          d3.select('#tooltip').classed('hidden', true);
        });
  
      _chartArea.append('g')
                  .attr('class', 'axis')
                  .attr('transform', 'translate(0,' + height + ')')
                  .call(xAxis);
  
      _chartArea.append('g')
                  .attr('class', 'axis')
                  .call(yAxis);
    }
  
    return _chart.anchor(parent, chartGroup);
  };