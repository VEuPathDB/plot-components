import React from "react";
import PlotlyPlot from "./PlotlyPlot";
import { PlotComponentProps } from "./Types";

export default function Histogram(props: PlotComponentProps<'labels'|'values'>) {
  return <PlotlyPlot {...props} type="pie"/>
}
