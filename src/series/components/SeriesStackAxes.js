import React, { Fragment } from "react";
import { bisector } from "d3-array";
import { Group, Line } from "@vx/vx";
import { AxisBottom, AxisTop, AxisLeft, withTooltip, Tooltip } from "@vx/vx";
import { getPosition } from "../util/pointer";
import {} from "../state";
import Epoch from "./Epoch";

const Border = ({ top, left, right, bottom, width, height, fill }) => {
  return (
    <Group width={width} height={height}>
      <rect x={0} y={0} width={left} height={height} fill={fill} />
      <rect x={left} y={0} width={width - left} height={top} fill={fill} />
      <rect
        x={left}
        y={height - bottom}
        width={width - left}
        height={bottom}
        fill={fill}
      />
      <rect
        x={width - right}
        y={top}
        width={right}
        height={height - top - bottom}
        fill={fill}
      />
    </Group>
  );
};

const SeriesStackAxes = ({
  x,
  y,
  xScale,
  yScale,
  width,
  height,
  epochTags,
  seriesCollection = [],
  signalPadding = 0,
  margin = {
    top: 30,
    left: 50,
    right: 30,
    bottom: 30
  },
  borderFill = "#fff",
  axisProps = {
    top: {},
    bottom: {},
    left: { numTicks: 4 }
  },
  renderSeries,
  initEditEpochStart,
  initEditEpochEnd,
  continueEpoch,
  stopEditEpochStart,
  stopEditEpochEnd,
  showTooltip,
  updateTooltip,
  hideTooltip,
  tooltipOpen,
  tooltipData,
  tooltipLeft,
  tooltipTop,
  tooltipFormatX = x => x,
  tooltipFormatY = x => x,
  tickFormatX = x => x,
  tickFormatY = y => y
}) => {
  if (seriesCollection.length === 0) {
    return null;
  }
  const numRows = seriesCollection.length;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rowHeight = plotHeight / numRows;
  const innerGroupProps = {
    top: margin.top,
    left: margin.left,
    width: plotWidth,
    height: plotHeight
  };
  const computeTooltipProps = event => {
    const position = getPosition(event, innerGroupProps);
    const tooltipLeft = xScale.invert(position.x);
    const tooltipTop = yScale.invert(position.y % rowHeight);
    const bisect = bisector(x).left;
    const tooltipData = seriesCollection.map(series =>
      series.traces.map(trace => trace[bisect(trace, tooltipLeft, 1)])
    );
    return { tooltipData, tooltipLeft, tooltipTop };
  };
  const onMouseMove = event => {
    event.stopPropagation();
    if (showTooltip) {
      showTooltip(computeTooltipProps(event));
    }
  };
  const onMouseLeave = event => {
    if (hideTooltip) {
      hideTooltip();
    }
  };
  const computeRowScale = index =>
    yScale
      .copy()
      .rangeRound([
        (index + 1) * rowHeight - signalPadding,
        index * rowHeight + signalPadding
      ]);
  const leftAxes = seriesCollection.map((_, i) => {
    const scale = computeRowScale(i);
    const domain = scale.domain();
    const tickFormat = tick =>
      tick === domain[0] || tick === domain[1]
        ? null
        : tickFormatY(tick.toString());
    return (
      <AxisLeft
        key={i}
        hideTicks
        tickFormat={tickFormat}
        scale={scale}
        {...axisProps.left}
      />
    );
  });
  const epochs = seriesCollection.map((series, i) => {
    const handlers = {
      initEditEpochStart,
      initEditEpochEnd,
      continueEpoch,
      stopEditEpochStart,
      stopEditEpochEnd
    };
    return (
      <Group y={rowHeight * i} height={rowHeight} width={plotWidth}>
        {series.epochs.map((epoch, j) => (
          <Epoch
            epochTags={epochTags}
            seriesId={series.id}
            epochIndex={j}
            start={epoch[0]}
            end={epoch[1]}
            height={rowHeight}
            xScale={xScale}
            {...handlers}
          />
        ))}
      </Group>
    );
  });
  const signalGeometry = seriesCollection.map((series, i) => {
    if (!renderSeries) {
      return null;
    }
    const rowScale = computeRowScale(i);
    const range = rowScale.range();
    const y = Math.min(...range);
    const Component = renderSeries;
    return (
      <Group key={`${i},${seriesCollection.length}`} y={y}>
        {series.traces.map((trace, j) => (
          <Component
            key={`${i},${j},${seriesCollection.length},${series.length}`}
            seriesIndex={i}
            traceIndex={j}
            data={trace}
            xScale={xScale}
            yScale={rowScale}
            width={plotWidth}
            height={rowHeight}
          />
        ))}
        {tooltipData && (
          <Line
            from={{ x: xScale(tooltipLeft), y: range[0] }}
            to={{ x: xScale(tooltipLeft), y: range[1] }}
            stroke={"black"}
            strokeWidth={1}
          />
        )}
      </Group>
    );
  });
  const SeriesToolTip = ({ top, left, children }) => (
    <Tooltip top={top} left={left}>
      {children}
    </Tooltip>
  );
  const XToolTip = ({ top }) => (
    <SeriesToolTip
      top={top}
      left={xScale(tooltipLeft) + innerGroupProps.left + 12}
    >
      {`${tooltipFormatX(tooltipLeft)}`}
    </SeriesToolTip>
  );
  const renderTracesTooltip = (traces, i) => (
    <SeriesToolTip
      top={rowHeight * (i + 0.5)}
      left={xScale(tooltipLeft) + innerGroupProps.left + 12}
    >
      <ul style={{ listStyleType: "none", margin: "0", padding: "0" }}>
        {traces.map(trace => trace && <li>{tooltipFormatY(y(trace))}</li>)}
      </ul>
    </SeriesToolTip>
  );
  return (
    <div
      style={{ position: "relative" }}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      <svg width={width} height={height}>
        <Group {...innerGroupProps}>
   	  {signalGeometry}
	  {epochs}
	</Group>
        <Border width={width} height={height} fill={borderFill} {...margin} />
        <Group {...innerGroupProps}>
          <AxisTop
            scale={xScale.rangeRound([0, plotWidth])}
            tickFormat={v => tickFormatX(v.toString())}
            {...axisProps.top}
          />
          <AxisBottom
            top={plotHeight}
            tickFormat={v => tickFormatX(v.toString())}
            scale={xScale.rangeRound([0, plotWidth])}
            {...axisProps.bottom}
          />
          {leftAxes}
        </Group>
      </svg>
      {tooltipData && (
        <Fragment>
          <XToolTip top={-18} />
          {tooltipData.map(renderTracesTooltip)}
          <XToolTip top={height + 6} />
        </Fragment>
      )}
    </div>
  );
};

export default withTooltip(SeriesStackAxes);