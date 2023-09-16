import { LatLngExpression, LatLngTuple } from 'leaflet'

export interface ZoneData {
    name: string,
    min: number,
    safe: number,
    max: number,
    shape: LatLngExpression[]
}
