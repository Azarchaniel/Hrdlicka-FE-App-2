import React, { useRef, useEffect } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import XYZ from 'ol/source/XYZ';
import { Style, Fill, Stroke } from 'ol/style';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import geojsonData from '../data/polygons.json'; // Import GeoJSON

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

const MapComponent = () => {
    const mapRef = useRef(null);

    useEffect(() => {
        const vectorSource = new VectorSource({
            features: new GeoJSON().readFeatures(geojsonData, {
                featureProjection: krovak.code,
            }),
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(0, 123, 255, 0.5)',
                }),
                stroke: new Stroke({
                    color: '#0056b3',
                    width: 2,
                }),
            }),
        });

        const map = new Map({
            target: mapRef.current!,
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    }),
                }),
                vectorLayer,
            ],
            view: new View({
                projection: krovak.code,
                center: [-749992.3, -1045788.0],
                zoom: 17,
            }),
        });

        return () => {
            map.setTarget(undefined);
        };
    }, []);

    return (
        <div
            ref={mapRef}
            style={{ width: '100%', height: '400px' }}
        ></div>
    );
};

export default MapComponent;
