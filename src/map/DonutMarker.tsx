import React from 'react';

//DKDK leaflet
import L from 'leaflet';

//DKDK anim
import BoundsDriftMarker, { BoundsDriftMarkerProps } from './BoundsDriftMarker';

import PiePlot from '../plots/PiePlot';
import { PiePlotData, PiePlotDatum } from '../types/plots';

//DKDK ts definition for HistogramMarkerSVGProps: need some adjustment but for now, just use Donut marker one
export interface DonutMarkerProps extends BoundsDriftMarkerProps {
  data: {
    value: number;
    label: string;
    color?: string;
  }[];
  isAtomic?: boolean; // add a special thumbtack icon if this is true
  onClick?: (event: L.LeafletMouseEvent) => void | undefined;
}

// DKDK convert to Cartesian coord. toCartesian(centerX, centerY, Radius for arc to draw, arc (radian))
function toCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInRadianInput: number
) {
  // console.log("angleInRadianInput = ", angleInRadianInput)
  let angleInRadians = angleInRadianInput - Math.PI / 2;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// DKDK input radian: makeArc(centerX, centerY, Radius for arc to draw, start point of arc (radian), end point of arc (radian))
function makeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  // console.log("startAngle = ", startAngle)
  // console.log("endAngle = ", endAngle)
  let dValue;
  let endAngleOriginal = endAngle;
  if (endAngleOriginal - startAngle === 2 * Math.PI) {
    endAngle = (359 * Math.PI) / 180;
  }

  let start = toCartesian(x, y, radius, endAngle);
  let end = toCartesian(x, y, radius, startAngle);

  let arcSweep = endAngle - startAngle <= Math.PI ? '0' : '1';

  if (endAngleOriginal - startAngle === 2 * Math.PI) {
    dValue = [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      arcSweep,
      0,
      end.x,
      end.y,
      'z',
    ].join(' ');
  } else {
    dValue = [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      arcSweep,
      0,
      end.x,
      end.y,
    ].join(' ');
  }

  return dValue;
}

// making k over 9999, e.g., 223832 -> 234k
function kFormatter(num: number) {
  //DKDK fixed type error regarding toFixed() that returns string
  return Math.abs(num) > 9999
    ? (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(0) + 'k'
    : Math.sign(num) * Math.abs(num);
}

/**
 * DKDK this is a SVG donut marker icon
 */
export default function DonutMarker(props: DonutMarkerProps) {
  let fullStat: PiePlotData = { slices: [] };
  let defaultColor: string = '';
  for (let i = 0; i < props.data.length; i++) {
    // Currently this only serves to initialize missing colors as 'silver'
    let datum = props.data[i];

    if (datum.color) {
      defaultColor = datum.color;
    } else {
      defaultColor = 'silver';
    }

    fullStat.slices.push({
      // color: props.colors[i],
      color: defaultColor,
      label: datum.label,
      value: datum.value,
    });
  }

  //DKDK construct histogram marker icon
  const size = 40; //DKDK SVG donut marker icon size: note that popbio/mapveu donut marker icons = 40
  let svgHTML: string = ''; //DKDK divIcon HTML contents

  //DKDK set drawing area
  svgHTML += '<svg width="' + size + '" height="' + size + '">'; //DKDK initiate svg marker icon

  //DKDK summation of fullStat.value per marker icon
  let sumValues: number = fullStat.slices
    .map((o) => o.value)
    .reduce((a, c) => {
      return a + c;
    });
  //DKDK convert large value with k (e.g., 12345 -> 12k): return original value if less than a criterion
  let sumLabel: number | string = kFormatter(sumValues);

  //DKDK draw white circle
  svgHTML +=
    '<circle cx="' +
    size / 2 +
    '" cy="' +
    size / 2 +
    '" r="' +
    size / 2 +
    '" stroke="green" stroke-width="0" fill="white" />';

  //DKDK set start point of arc = 0
  let startValue: number = 0;
  //DKDK create arcs for data
  fullStat.slices.forEach(function (el: PiePlotDatum) {
    //DKDK if sumValues = 0, do not draw arc
    if (sumValues > 0) {
      //DKDK compute the ratio of each data to the total number
      let arcValue: number = el.value / sumValues;
      //DKDK draw arc: makeArc(centerX, centerY, Radius for arc, start point of arc (radian), end point of arc (radian))
      svgHTML +=
        '<path fill="none" stroke="' +
        el.color +
        '" stroke-width="4" d="' +
        makeArc(
          size / 2,
          size / 2,
          size / 2 - 2,
          startValue,
          startValue + arcValue * 2 * Math.PI
        ) +
        '" />';
      //DKDK set next startValue to be previous arcValue
      startValue = startValue + arcValue * 2 * Math.PI;
    }
  });

  //DKDK adding total number text/label and centering it
  svgHTML +=
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" opacity="1" fill="#505050" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="1em">' +
    sumLabel +
    '</text>';

  //DKDK check isAtomic: draw pushpin if true
  if (props.isAtomic) {
    let pushPinCode = '&#128392;';
    svgHTML +=
      '<text x="86%" y="14%" dominant-baseline="middle" text-anchor="middle" opacity="0.75" font-weight="bold" font-size="1.2em">' +
      pushPinCode +
      '</text>';
  }

  // DKDK closing svg tag
  svgHTML += '</svg>';

  //DKDK set icon
  let SVGDonutIcon: any = L.divIcon({
    className: 'leaflet-canvas-icon', //DKDK need to change this className but just leave it as it for now
    iconSize: new L.Point(size, size), //DKDK this will make icon to cover up SVG area!
    iconAnchor: new L.Point(size / 2, size / 2), //DKDK location of topleft corner: this is used for centering of the icon like transform/translate in CSS
    html: svgHTML, //DKDK divIcon HTML svg code generated above
  });

  //DKDK anim check duration exists or not
  let duration: number = props.duration ? props.duration : 300;

  const plotSize = 150;
  const marginSize = 0;

  const popupPlot = (
    <PiePlot
      data={fullStat}
      donutOptions={{
        size: 0.5,
        text: sumLabel as string,
        fontSize: 18,
      }}
      width={plotSize}
      height={plotSize}
      spacingOptions={{
        marginLeft: marginSize,
        marginRight: marginSize,
        marginTop: marginSize,
        marginBottom: marginSize,
      }}
      displayLegend={false}
      showHoverInfo={false}
      displayLibraryControls={false}
      textOptions={{
        displayPosition: 'inside',
        displayOption: 'text',
        sliceOverrides: fullStat.slices.map((datum) =>
          datum.value / sumValues >= 0.015 ? datum.value.toString() : ''
        ),
      }}
    />
  );

  return (
    <BoundsDriftMarker
      id={props.id}
      position={props.position}
      bounds={props.bounds}
      icon={SVGDonutIcon}
      duration={duration}
      popupContent={{
        content: popupPlot,
        size: {
          width: plotSize,
          height: plotSize,
        },
      }}
      showPopup={props.showPopup}
      popupClass="donut-popup"
    />
  );
}
