import React, { useRef, useEffect } from 'react';
import 'ol/ol.css';
import {Map, Overlay, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Fill, Stroke } from 'ol/style';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import {TileWMS} from "ol/source";

import geojsonData from '../data/polygons.json'; // data


// Define the custom Krovak projection
const krovak = {
    code: 'EPSG:5514',
    extent: [-925000, -1444353.536, -400646.464, -920000],
    def: `+proj=krovak
        +lat_0=49.5
        +lon_0=24.83333333333333
        +alpha=30.28813972222222
        +k=0.9999
        +x_0=0
        +y_0=0
        +ellps=bessel
        +towgs84=570.8,85.7,462.8,4.998,1.587,5.261,3.56
        +units=m
        +no_defs`,
};

proj4.defs(krovak.code, krovak.def);
register(proj4);

const getFillColor = (value: any) => {
    switch (value) {
        case 1:
            return 'rgba(255, 0, 0, 0.6)'; // red
        case 2:
            return 'rgba(255, 255, 0, 0.6)'; // yellow
        case 3:
            return 'rgba(0, 255, 0, 0.6)'; // green
        case 4:
            return 'rgba(0, 0, 255, 0.6)'; // blue
        default:
            return 'rgba(128, 128, 128, 0.6)'; // default gray
    }
};

const getFeatureStyle = (feature: any) => {
    const value = feature.get('hodnota'); // get value by identificator "hodnota"
    return new Style({
        fill: new Fill({
            color: getFillColor(value),
        }),
        stroke: new Stroke({
            color: 'rgba(128, 128, 128, 0.6)',
            width: 1,
        }),
    });
};

const MapComponent = () => {
    const mapRef = useRef(null);
    const tooltipRef =  useRef<Overlay | null>(null);

    useEffect(() => {
        const tooltipElement = document.createElement('div');
        tooltipElement.style.position = 'absolute';
        tooltipElement.style.backgroundColor = 'white';
        tooltipElement.style.padding = '5px';
        tooltipElement.style.border = '1px solid black';
        tooltipElement.style.borderRadius = '4px';
        tooltipElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        tooltipElement.style.pointerEvents = 'none';
        tooltipElement.style.whiteSpace = 'nowrap';
        tooltipElement.style.textAlign = 'start';

        (tooltipRef.current as Overlay) = new Overlay({
            element: tooltipElement,
            offset: [10, 0],
            positioning: 'center-left',
        });

        const vectorSource = new VectorSource({
            features: new GeoJSON().readFeatures(geojsonData, {
                featureProjection: krovak.code,
            }),
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: getFeatureStyle,
        });

        const wmsLayer = new TileLayer({
            source: new TileWMS({
                url: 'https://geoportal.cuzk.cz/WMS_ZM25_PUB/WMService.aspx', //WMS as background map
                params: {
                    LAYERS: 'GR_ZM25',
                    FORMAT: 'image/png',
                    TRANSPARENT: true,
                },
                serverType: 'geoserver',
                crossOrigin: 'anonymous',
            }),
        });

        const map = new Map({
            target: mapRef.current!,
            layers: [
                wmsLayer,
                vectorLayer,
            ],
            view: new View({
                projection: krovak.code,
                center: [-749992.3, -1045788.0],
                zoom: 16.5,
            }),
            overlays: [tooltipRef.current as Overlay]
        });

        map.on('pointermove', (event) => {
            const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
            if (feature) {
                const id = feature.get('id');
                const pole = feature.get('pole');
                tooltipElement.innerHTML = `<b>ID:</b> ${id}<br/><b>Název:</b> ${pole}`;
                (tooltipRef.current as Overlay).setPosition(event.coordinate);
                tooltipElement.style.display = 'block';
            } else {
                tooltipElement.style.display = 'none';
            }
        });

        return () => {
            map.setTarget(undefined);
        };
    }, []);

    return (
        <div
            ref={mapRef}
            style={{ width: '800px', height: '500px' }}
        ></div>
    );
};

export default MapComponent;
