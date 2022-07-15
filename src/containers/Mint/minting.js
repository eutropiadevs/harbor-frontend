import * as PropTypes from "prop-types";
import { SvgIcon } from "../../components/common";
import { connect } from "react-redux";
import { message, Spin } from "antd";
import { useNavigate } from "react-router";
import "./index.scss";
import "./index.scss";
import { iconNameFromDenom } from "../../utils/string";
import TooltipIcon from "../../components/TooltipIcon";
import React, { useEffect, useState } from "react";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, PRODUCT_ID } from "../../constants/common";
import { setAssetList, setPairs } from "../../actions/asset";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import {
  setAllExtendedPair,
  setCurrentPairID,
  setSelectedExtentedPairvault,
} from "../../actions/locker";
import { amountConversionWithComma } from "../../utils/coin";
import NoData from "../../components/NoData";
import { queryAssets, queryExtendedPairVaultById, queryPair } from "../../services/asset/query";
import { decimalConversion } from "../../utils/number";
import { queryVaultMintedStatistic } from "../../services/vault/query";

const Minting = ({ address }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const extenedPairVaultList = useSelector(
    (state) => state.locker.extenedPairVaultList[0]
  );
  const assetList = useSelector(
    (state) => state.asset?.assetList
  );

  const [loading, setLoading] = useState(false);
  const [vaultDebt, setVaultDebt] = useState([])
  const [pairId, setpairId] = useState({})

  const navigateToMint = (path) => {
    navigate({
      pathname: `/vault/${path}`,
    });
  };

  useEffect(() => {
    fetchExtendexPairList(PRODUCT_ID);
    fetchAssets(
      (DEFAULT_PAGE_NUMBER - 1) * DEFAULT_PAGE_SIZE,
      DEFAULT_PAGE_SIZE,
      true,
      false
    );

  }, [address])

  useEffect(() => {
    if (extenedPairVaultList?.length > 0) {
      fetchVaultMintedTokenStatistic(PRODUCT_ID)
    }

  }, [address, extenedPairVaultList])

  const fetchExtendexPairList = (productId) => {
    setLoading(true);
    queryExtendedPairVaultById(productId, (error, data) => {
      setLoading(false);
      if (error) {
        message.error(error);
        return;
      }
      dispatch(setAllExtendedPair(data?.extendedPair));
    });
  };

  const fetchVaultMintedTokenStatistic = (productId) => {
    setLoading(true);
    queryVaultMintedStatistic(productId, (error, data) => {
      setLoading(false);
      if (error) {
        message.error(error);
        return;
      }
      setVaultDebt((vaultDebt) => [...vaultDebt, data?.pairStatisticData])
    });
  };

  const fetchAssets = (offset, limit, countTotal, reverse) => {
    setLoading(true)
    queryAssets(offset, limit, countTotal, reverse, (error, data) => {
      setLoading(false)
      if (error) {
        message.error(error);
        return;
      }
      dispatch(setAssetList(data.assets))
    });
  };
  const fetchAssetIdFromPairID = (pairId, extendexPairId) => {
    setLoading(true)
    queryPair(pairId, (error, data) => {
      setLoading(false)
      if (error) {
        message.error(error);
        return;
      }
      setpairId((prevState) => ({
        [extendexPairId]: data?.pairInfo?.assetIn?.low,
        ...prevState,
      }));

    });
  };

  const getAsssetIcon = (assetId) => {
    const selectedItem = assetList.length > 0 && assetList.filter((item) => (item?.id).toNumber() === assetId);

    return selectedItem[0]?.denom || ""
  }

  useEffect(() => {
    if (extenedPairVaultList?.length > 0) {
      extenedPairVaultList.map((item, index) => {
        fetchAssetIdFromPairID(item?.pairId?.low, item?.id?.low)
      })
    }
  }, [extenedPairVaultList])

  useEffect(() => {
    setVaultDebt([])
    setpairId({});
  }, [])


  if (loading) {
    return <Spin />;
  }
  return (
    <div className="app-content-wrapper vault-mint-main-container">
      <div className="card-main-container">
        {extenedPairVaultList?.length > 0 ? <h1 className="choose-vault">Choose Your Vault Type</h1> : ""}
        {extenedPairVaultList?.length > 0 ? (
          extenedPairVaultList?.map((item, index) => {
            if (
              item &&
              !item.isStableMintVault &&
              item.appId.low === PRODUCT_ID
            ) {
              return (
                <React.Fragment key={index}>
                  {item &&
                    !item.isStableMintVault &&
                    item.appId.low === PRODUCT_ID && (
                      <div
                        className="card-container "
                        onClick={() => {
                          dispatch(setCurrentPairID(item?.pairId?.low));
                          dispatch(setSelectedExtentedPairvault(item));
                          navigateToMint(item?.id?.low);
                        }}
                      >
                        <div className="up-container">
                          <div className="icon-container">
                            <SvgIcon name={iconNameFromDenom(getAsssetIcon(pairId[item?.id?.low]))} />
                          </div>
                          <div className="vault-name-container">
                            <div className="vault-name">{item?.pairName}</div>
                            <div className="vault-desc" />
                          </div>
                        </div>
                        <div className="bottom-container">
                          <div className="contenet-container">
                            <div className="name">
                              Min. Collateralization Ratio{" "}
                              <TooltipIcon text="Minimum collateral ratio at which composite should be minted" />
                            </div>
                            <div className="value">
                              {(decimalConversion(item?.minCr) * 100).toFixed(2)} %
                            </div>
                          </div>
                          <div className="contenet-container">
                            <div className="name">
                              Stability Fee <TooltipIcon text="Current Interest Rate on Borrowed Amount" />
                            </div>
                            <div className="value">
                              {decimalConversion(item?.stabilityFee) * 100} %
                            </div>
                          </div>
                          <div className="contenet-container">
                            <div className="name">
                              Min. Borrow Amount <TooltipIcon text="Minimum composite that should be borrowed for any active vault" />
                            </div>
                            <div className="value">
                              {" "}
                              {amountConversionWithComma(item?.debtFloor)} CMST
                            </div>
                          </div>
                          <div className="contenet-container">
                            <div className="name">
                              Debt Ceiling <TooltipIcon text="Maximum Composite that can be withdrawn per vault type" />
                            </div>
                            <div className="value">
                              {" "}
                              {amountConversionWithComma(item?.debtCeiling)} CMST
                            </div>
                          </div>

                          <div className="contenet-container">
                            <div className="name">
                              Vault’s Global Debt <TooltipIcon text="The total $CMST Debt of the protocol against this vault type" />
                            </div>
                            <div className="value">
                              {vaultDebt.length > 0 ? amountConversionWithComma(vaultDebt[0] && vaultDebt[0][index]?.collateralAmount ? vaultDebt[0] && vaultDebt[0][index]?.collateralAmount : 0.000000) : "0.000000"} CMST
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                </React.Fragment>
              );
            }
          })
        ) : (
          <NoData />
        )}
      </div>
    </div >
  );
};

Minting.propTypes = {
  lang: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  setPairs: PropTypes.func.isRequired,
};

const stateToProps = (state) => {
  return {
    lang: state.language,
    address: state.account.address,
    pairs: state.asset.pairs,
  };
};

const actionsToProps = {
  setPairs,
};

export default connect(stateToProps, actionsToProps)(Minting);
