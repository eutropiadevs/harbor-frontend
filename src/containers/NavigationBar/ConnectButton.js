import { Button, Dropdown } from "antd";
import { decode } from "js-base64";
import Lodash from "lodash";
import * as PropTypes from "prop-types";
import React, { useCallback, useEffect } from "react";
import { connect } from "react-redux";
import {
  setAccountAddress,
  setAccountBalances,
  setAccountName,
  setAssetBalance,
  setPoolBalance,
  showAccountConnectModal
} from "../../actions/account";
import { setPoolPrice } from "../../actions/liquidity";
import { setMarkets } from "../../actions/oracle";
import { cmst, comdex, harbor, ibcDenoms } from "../../config/network";
import { HARBOR_POOL_ID_LIST } from "../../constants/common";
import { queryAllBalances } from "../../services/bank/query";
import { fetchKeplrAccountName } from "../../services/keplr";
import { queryPool } from "../../services/liquidity/query";
import { queryMarketList } from "../../services/oracle/query";
import { getPoolPrice, marketPrice } from "../../utils/number";
import variables from "../../utils/variables";
import DisConnectModal from "../DisConnectModal";
import ConnectModal from "../Modal";

const ConnectButton = ({
  setAccountAddress,
  address,
  setAccountBalances,
  lang,
  setAssetBalance,
  setPoolBalance,
  markets,
  refreshBalance,
  setMarkets,
  poolBalances,
  setAccountName,
  setPoolPrice,
  poolPriceMap,
  balances,
}) => {
  useEffect(() => {
    const savedAddress = localStorage.getItem("ac");
    const userAddress = savedAddress ? decode(savedAddress) : address;

    if (userAddress) {
      setAccountAddress(userAddress);

      fetchKeplrAccountName().then((name) => {
        setAccountName(name);
      });
    }
  }, [address, refreshBalance]);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const getPrice = (denom) => {
    return poolPriceMap[denom] || marketPrice(markets, denom) || 0;
  };

  const calculateAssetBalance = useCallback(
    (balances) => {
      const assetBalances = balances.filter(
        (item) =>
          item.denom.substr(0, 4) === "ibc/" ||
          item.denom === comdex.coinMinimalDenom ||
          item.denom === cmst.coinMinimalDenom ||
          item.denom === harbor.coinMinimalDenom
      );

      const value = assetBalances.map((item) => {
        if (item?.denom === ibcDenoms["weth-wei"]) {
          return getPrice(item.denom) * (item.amount / 10 ** 12); // dividing with 10**12 as it is a ethereum network
        }

        return getPrice(item.denom) * item.amount;
      });

      setAssetBalance(Lodash.sum(value));
    },
    [getPrice, setAssetBalance]
  );

  const calculatePoolBalance = useCallback(() => {
    const sum = Lodash.sumBy(poolBalances);

    setPoolBalance(Number(sum * 10 ** 6));
  }, [poolBalances, setPoolBalance]);

  const fetchBalances = useCallback(
    (address) => {
      queryAllBalances(address, (error, result) => {
        if (error) {
          return;
        }

        setAccountBalances(result.balances, result.pagination);
        calculateAssetBalance(result.balances);
        calculatePoolBalance(result.balances);
      });
    },
    [calculateAssetBalance, setAccountBalances, calculatePoolBalance]
  );

  useEffect(() => {
    if (address) {
      fetchBalances(address);
    }
  }, [address, refreshBalance, markets]);

  useEffect(() => {
    calculateAssetBalance(balances);
  }, [balances, poolPriceMap, markets]);

  const fetchMarkets = (offset, limit, isTotal, isReverse) => {
    queryMarketList(offset, limit, isTotal, isReverse, (error, result) => {
      if (error) {
        return;
      }

      setMarkets(result.markets, result.pagination);
    });
  };

  const calculatePoolPrice = useCallback(
    (pool) => {
      if (pool?.id) {
        let firstAsset = pool?.balances[0];
        let secondAsset = pool?.balances[1];

        let oracleAsset = {};
        if (marketPrice(markets, firstAsset?.denom)) {
          oracleAsset = firstAsset;
        } else if (marketPrice(markets, secondAsset?.denom)) {
          oracleAsset = secondAsset;
        }

        if (oracleAsset?.denom) {
          let { xPoolPrice, yPoolPrice } = getPoolPrice(
            marketPrice(markets, oracleAsset?.denom),
            oracleAsset?.denom,
            firstAsset,
            secondAsset
          );

          setPoolPrice(firstAsset?.denom, xPoolPrice);
          setPoolPrice(secondAsset?.denom, yPoolPrice);
        }
      }
    },
    [markets, setPoolPrice]
  );

  useEffect(() => {
    const fetchListedPools = (list) => {
      if (list?.length > 0) {
        for (let i = 0; i < list?.length; i++) {
          queryPool(list[i], (error, result) => {
            if (error) {
              return;
            }

            calculatePoolPrice(result?.pool);
          });
        }
      }
    };

    fetchListedPools(HARBOR_POOL_ID_LIST);
  }, [calculatePoolPrice]);

  const WalletConnectedDropdown = <ConnectModal />;

  return (
    <>
      {address ? (
        <div className="connected_div">
          <DisConnectModal />
        </div>
      ) : (
        <div>
          <Dropdown
            overlay={WalletConnectedDropdown}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button shape="round" type="primary">
              {variables[lang].connect}
            </Button>
          </Dropdown>
        </div>
      )}
    </>
  );
};

ConnectButton.propTypes = {
  lang: PropTypes.string.isRequired,
  refreshBalance: PropTypes.number.isRequired,
  setAccountAddress: PropTypes.func.isRequired,
  showAccountConnectModal: PropTypes.func.isRequired,
  setAccountBalances: PropTypes.func.isRequired,
  setAccountName: PropTypes.func.isRequired,
  setAssetBalance: PropTypes.func.isRequired,
  setMarkets: PropTypes.func.isRequired,
  setPoolBalance: PropTypes.func.isRequired,
  setPoolPrice: PropTypes.func.isRequired,
  address: PropTypes.string,
  balances: PropTypes.arrayOf(
    PropTypes.shape({
      denom: PropTypes.string.isRequired,
      amount: PropTypes.string,
    })
  ),
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
  poolBalances: PropTypes.array,
  poolPriceMap: PropTypes.object,
  pools: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.shape({
        high: PropTypes.number,
        low: PropTypes.number,
        unsigned: PropTypes.bool,
      }),
      reserveAccountAddress: PropTypes.string,
      poolCoinDenom: PropTypes.string,
      reserveCoinDenoms: PropTypes.array,
    })
  ),
  show: PropTypes.bool,
};

const stateToProps = (state) => {
  return {
    lang: state.language,
    address: state.account.address,
    show: state.account.showModal,
    markets: state.oracle.market.list,
    refreshBalance: state.account.refreshBalance,
    poolBalances: state.liquidity.poolBalances,
    pools: state.liquidity.pool.list,
    poolPriceMap: state.liquidity.poolPriceMap,
    balances: state.account.balances.list,
  };
};

const actionsToProps = {
  showAccountConnectModal,
  setAccountAddress,
  setAccountBalances,
  setPoolBalance,
  setAssetBalance,
  setMarkets,
  setAccountName,
  setPoolPrice,
};

export default connect(stateToProps, actionsToProps)(ConnectButton);
