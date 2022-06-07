import { List } from "antd";
import * as PropTypes from "prop-types";
import {connect, useSelector} from "react-redux";
import {commaSeparator, decimalConversion, marketPrice} from "../../../../../utils/number";
import {amountConversion, denomConversion} from "../../../../../utils/coin";
import {DOLLAR_DECIMALS} from "../../../../../constants/common";
import {cmst, comdex} from "../../../../../config/network";

const PricePool = ({ownerVaultInfo, markets, pair}) => {
    const selectedExtendedPairVaultListData = useSelector((state) => state.locker.extenedPairVaultListData[0]);

    const collateralDeposited = Number(amountConversion(ownerVaultInfo?.amountIn)) *
        marketPrice(markets, pair?.denomIn);

    const collateral = Number(amountConversion(ownerVaultInfo?.amountIn || 0));
    const collateralToBeTaken = 0;
    const borrowed = Number(amountConversion(ownerVaultInfo?.amountOut || 0));
    const debtToBeBorrowed = 0;

    const liquidationRatio = selectedExtendedPairVaultListData?.liquidationRatio;

    const liquidationPrice  = (decimalConversion(liquidationRatio)) * (( borrowed + debtToBeBorrowed) / (collateral + collateralToBeTaken))

    const data = [
    {
      title: "Liquidation Price",
        counts: `$${commaSeparator(Number(liquidationPrice || 0).toFixed(DOLLAR_DECIMALS))}`
    },
    {
      title: "Collateral Deposited",
        counts: `$${commaSeparator(Number(collateralDeposited || 0).toFixed(DOLLAR_DECIMALS))}`
    },
    {
      title: "Oracle Price",
        counts: `$${commaSeparator(Number(marketPrice(markets, pair?.denomIn) || 0).toFixed(DOLLAR_DECIMALS))}`
    },
    {
      title: "Withdrawn",
        counts: `${commaSeparator(Number(borrowed || 0).toFixed(comdex?.coinDecimals))} ${denomConversion(cmst?.coinMinimalDenom)}`
    },
  ];
  return (
    <>
      <div className="composite-card farm-content-card earn-deposite-card ">
        <div className="card-head"></div>
        <List
          grid={{
            gutter: 16,
            xs: 2,
            sm: 2,
            md: 3,
            lg: 2,
            xl: 2,
            xxl: 2,
          }}
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <div>
                <p>{item.title}</p>
                <h3>{item.counts}</h3>
              </div>
            </List.Item>
          )}
        />
      </div>
    </>
  );
};

PricePool.prototype = {
    markets: PropTypes.arrayOf(
        PropTypes.shape({
            rates: PropTypes.shape({
                high: PropTypes.number,
                low: PropTypes.number,
                unsigned: PropTypes.bool,
            }),
            symbol: PropTypes.string,
            script_id: PropTypes.string,
        })
    ),
    ownerVaultInfo: PropTypes.array,
    pair: PropTypes.shape({
        denomIn: PropTypes.string,
        denomOut: PropTypes.string,
    }),
}

const stateToProps = (state) => {
    return {
        ownerVaultInfo: state.locker.ownerVaultInfo,
        markets: state.oracle.market.list,
        pair: state.asset.pair,
    };
};

export default connect(stateToProps)(PricePool);
