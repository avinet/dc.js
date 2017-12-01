dc.statLegend = {
  pieLegend: function (chart, _options) {
    var legendHeight = this.calcLegendHeight(chart, _options);

    var cy = legendHeight + chart.radius();
    var legendWidth = this.calcLegendWidth(_options);
    var legendItemWidth = this.calcLegendItemWidth(_options);

    chart
      .cy(cy)
      .legend(dc.legend()
        .y(_options.margins.top)
        .x(_options.margins.left)
        .itemHeight(_options.legendItemHeight)
        .gap(_options.legendGap)
        .autoItemWidth(_options.autoItemWidth)
        .legendWidth(legendWidth)
        .itemWidth(legendItemWidth)
        .horizontal(_options.horizontalLegend)
      );
  },

  legend: function (chart, _options, override) {
    if (override) {
      this.overrideLegendables(chart, _options);
    }

    var legendHeight = this.calcLegendHeight(chart, _options);
    var legendWidth = this.calcLegendWidth(_options);
    var legendItemWidth = this.calcLegendItemWidth(_options);

    chart
      .legend(dc.legend()
        .y(_options.margins.top)
        .x(_options.margins.left - _options.chartConfig.yAxisLabelPadding)
        .itemHeight(_options.legendItemHeight)
        .gap(_options.legendGap)
        .autoItemWidth(_options.autoItemWidth)
        .legendWidth(legendWidth)
        .itemWidth(legendItemWidth)
        .horizontal(_options.horizontalLegend)
      );

    chart.margins().top = legendHeight + chart.margins().top * 2;
  },

  overrideLegendables: function (chart, _options) {
    chart.legendables = function () {
      var data = chart.data();
      if (data.length > 0) {
        return data[0].groupData.map(function (d) {
          d.chart = chart;
          d.color = _options.colors(d.name);
          return d;
        });
      }
      return [];
    };
    chart.isLegendableHidden = function () { return false; };
  },

  calcLegendHeight: function (chart, _options) {
    var legendables = chart.legendables();
    var count = legendables ? legendables.length : 0;
    if (_options.horizontalLegend) {
      count = Math.ceil(count / 2);
    }
    return (_options.legendItemHeight + _options.legendGap) * count;
  },

  calcLegendWidth: function (_options) {
    return _options.horizontalLegend ? (_options.legendWidth / 2) : _options.legendWidth;
  },

  calcLegendItemWidth: function (_options) {
    return _options.horizontalLegend ? (_options.legendItemWidth / 2) * 0.9 : _options.legendItemWidth;
  }
};