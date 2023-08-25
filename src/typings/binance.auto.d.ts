import { PositionRiskResult } from "binance-api-node";
export interface IGetPositions {
    positions: {
        [symbol: string]: PositionRiskResult[]
    },
    symbol: string
}
export interface EGetPositions {
    margin?: number,
    PNL?: number,
    PNLPercent?: number
}