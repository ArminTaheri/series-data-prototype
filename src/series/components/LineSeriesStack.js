import React, { Fragment } from "react";
import { LinePath } from "@vx/vx";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import SeriesStackAxes from "./SeriesStackAxes";

const palette = scaleOrdinal(schemeCategory10);

const LineSeries = ({ data, x, y, xScale, yScale, traceIndex }) => {
  return (
    <Fragment>
      <LinePath
        data={data}
        x={x}
        y={y}
        xScale={xScale}
        yScale={yScale}
        stroke={palette(traceIndex)}
        strokeWidth={1}
      />
    </Fragment>
  );
};

const LineSeriesStack = ({ x, y, renderSeries, ...seriesStackAxesProps }) => (
  <SeriesStackAxes
    x={x}
    y={y}
    renderSeries={props => <LineSeries x={x} y={y} {...props} />}
    {...seriesStackAxesProps}
  />
);

export default LineSeriesStack;
