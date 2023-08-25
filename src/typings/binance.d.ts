export interface IItemPosition {
    symbol: string,
    positionAmt: string,
    entryPrice: string,
    markPrice: string,
    unRealizedProfit: string,
    liquidationPrice: string,
    leverage: string,
    maxNotionalValue: string,
    marginType: string,
    isolatedMargin: string,
    isAutoAddMargin: string,
    positionSide: "LONG" | "SHORT",
    notional: string,
    isolatedWallet: string,
    updateTime: number
}
export interface IAllCoinChart {
    symbol: string,
    price: string | number
}