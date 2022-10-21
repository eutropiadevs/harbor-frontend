import { Button, message } from "antd";
import Long from "long";
// import "./index.scss";
import * as PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { Col, Row, SvgIcon } from "../../../components/common";
import CustomInput from "../../../components/CustomInput";
import TooltipIcon from "../../../components/TooltipIcon";
import { ValidateInputNumber } from "../../../config/_validation";
import {
    amountConversion,
    amountConversionWithComma,
    denomConversion,
    getAmount,
    getDenomBalance,
} from "../../../utils/coin";
import { denomToSymbol, iconNameFromDenom, toDecimals } from "../../../utils/string";
import variables from "../../../utils/variables";
import { setAssets, setPair } from "../../../actions/asset";
import {
    setWhiteListedAssets,
    setAllWhiteListedAssets,
    setIsLockerExist,
    setOwnerVaultInfo,
    setCollectorData,
    setExtendedPairVaultListData,
    setSelectedExtentedPairvault
} from "../../../actions/locker";
import { queryAssets, queryPair, queryPairVault } from "../../../services/asset/query";
import {
    DEFAULT_FEE,
    DEFAULT_PAGE_NUMBER,
    DEFAULT_PAGE_SIZE,
    DOLLAR_DECIMALS,
    PRODUCT_ID,
} from "../../../constants/common";
import {
    queryLockerWhiteListedAssetByProductId,
    queryUserLockerByProductAssetId,
} from "../../../services/locker/query";
import Snack from "../../../components/common/Snack";
import { signAndBroadcastTransaction } from "../../../services/helper";
import { defaultFee } from "../../../services/transaction";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { queryCollectorInformation } from "../../../services/collector";
import { decimalConversion } from "../../../utils/number";
import {
    setAssetIn,
    setAssetOut,
    setAmountOut,
    setAmountIn,
} from "../../../actions/asset";
import { useParams } from "react-router";
import AssetList from '../../../config/ibc_assets.json'
import { comdex } from "../../../config/network";


const Deposit = ({
    lang,
    balances,
    address,
    setAssets,
    assets,
    setAmountIn,
    setAmountOut,
    outAmount,
    refreshBalance,
    setWhiteListedAssets,
    whiteListedAsset,
    ownerLockerInfo,
    setOwnerVaultInfo,
    setCollectorData,
    pair,
    setPair,
}) => {
    const { pathVaultId } = useParams();

    // New 
    const selectedExtentedPairVaultListData = useSelector((state) => state.locker.extenedPairVaultListData);
    const pairId = selectedExtentedPairVaultListData && selectedExtentedPairVaultListData[0]?.pairId?.low;
    const selectedIBCAsset = AssetList?.tokens.filter((item) => item.coinDenom === denomToSymbol(pair && pair?.denomOut));
    console.log(selectedExtentedPairVaultListData, "selectedExtentedPairVaultListData");
    console.log(pairId, "pairId");
    console.log(pair, "pair");


    const dispatch = useDispatch();
    const inAmount = useSelector((state) => state.asset.inAmount);
    const isLockerExist = useSelector((state) => state.locker.isLockerExist);
    const psmLockedAndMintedData = useSelector((state) => state.stableMint.lockAndMintedData);



    const [inProgress, setInProgress] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inputValidationError, setInputValidationError] = useState();
    const [collectorInfo, setCollectorInfo] = useState();
    const [validationError, setValidationError] = useState();
    const [currentExtentedVaultdata, setCurrentExtentedVaultdata] = useState();
    const [mintType, setMintType] = useState("Borrow CMST");
    const [pairDenomIn, setPairDenomIn] = useState("");
    const [pairDenomOut, setPairDenomOut] = useState("")
    const [editType, setEditType] = useState("Mint")
    const [lockAndMintedData, setLockAndMintedData] = useState()
    const [upperBoxValue, setUpperBoxValue] = useState("Locked")
    const [bottomBoxValue, setBottomBoxValue] = useState("Minted")
    const [lockedAmount, setLockedAmount] = useState(0);
    const [mintedAmount, setMintedAmount] = useState(0);

    const whiteListedAssetData = [];
    const resetValues = () => {
        dispatch(setAmountIn(0));
    };



    // new 

    const getAssetDataByPairId = (pairId) => {
        queryPair(pairId, (error, data) => {
            if (error) {
                message.error(error);
                return;
            }
            setPair(data?.pairInfo)
        })
    }


    const fetchQueryPairValut = (pairVaultId) => {
        setLoading(true)
        queryPairVault(pairVaultId, (error, data) => {
            if (error) {
                message.error(error);
                setLoading(false)
                return;
            }
            setCurrentExtentedVaultdata(data?.pairVault)
            dispatch(setExtendedPairVaultListData(data?.pairVault))
            dispatch(setSelectedExtentedPairvault(data?.pairVault))
            setLoading(false)
        })
    }


    useEffect(() => {
        fetchQueryPairValut(pathVaultId);
        if (pairId) {
            getAssetDataByPairId(pairId);
        }
    }, [address, pairId, refreshBalance])

    // end 


    const getAssetDenom = () => {
        assets?.map((item) => {
            if (item.id.low === whiteListedAsset[0]?.low) {
                whiteListedAssetData.push(item);
            }
        });
    };

    const handleFirstInputChange = (value) => {
        value = toDecimals(value).toString().trim();
        setInputValidationError(
            ValidateInputNumber(
                Number(getAmount(value)),
                AvailableAssetBalance,
                "macro"
            )
        );
        dispatch(setAmountIn(value));
    };

    const showInDollarValue = () => {
        const total = inAmount;

        return `≈ $${Number(total && isFinite(total) ? total : 0).toFixed(
            DOLLAR_DECIMALS
        )}`;
    };

    useEffect(() => {
        resetValues();
        fetchAssets(
            (DEFAULT_PAGE_NUMBER - 1) * DEFAULT_PAGE_SIZE,
            DEFAULT_PAGE_SIZE,
            true,
            false
        );
        fetchWhiteListedAssetByid(PRODUCT_ID);
    }, [address]);

    useEffect(() => {
        fetchCollectorStats();
    }, [whiteListedAsset]);

    useEffect(() => {
        fetchOwnerLockerExistByAssetId(PRODUCT_ID, whiteListedAssetId, address);
    }, [whiteListedAsset, refreshBalance])


    const fetchAssets = (offset, limit, countTotal, reverse) => {
        setInProgress(true);
        setLoading(true);
        queryAssets(offset, limit, countTotal, reverse, (error, data) => {
            setInProgress(false);
            setLoading(false);
            if (error) {
                message.error(error);
                return;
            }
            setAssets(data.assets, data.pagination);
        });
    };

    const fetchWhiteListedAssetByid = (productId) => {
        setInProgress(true);
        setLoading(true);
        queryLockerWhiteListedAssetByProductId(productId, (error, data) => {
            if (error) {
                message.error(error);
                return;
            }
            setWhiteListedAssets(data?.assetIds);
            setLoading(false);
        });
    };

    const fetchOwnerLockerExistByAssetId = (productId, assetId, address) => {
        queryUserLockerByProductAssetId(
            productId,
            assetId,
            address,
            (error, data) => {
                if (error) {
                    message.error(error);
                    return;
                }
                let lockerExist = data?.lockerInfo?.lockerId?.low;
                setOwnerVaultInfo(data?.lockerInfo);
                if (lockerExist) {
                    dispatch(setIsLockerExist(true));
                } else {
                    dispatch(setIsLockerExist(false));
                }
            }
        );
    };

    const fetchCollectorStats = () => {
        queryCollectorInformation((error, result) => {
            if (error) {
                message.error(error);
                return;
            }
            setCollectorData(result?.collectorLookup[0])
            setCollectorInfo(result?.collectorLookup[0]);
        });
    };

    getAssetDenom();

    const AvailableAssetBalance =
        getDenomBalance(balances, pair?.denomOut) || 0;
    const whiteListedAssetId = whiteListedAsset[0]?.low;
    const lockerId = ownerLockerInfo?.lockerId;

    const handleInputMax = () => {
        if (Number(AvailableAssetBalance)) {
            return dispatch(
                setAmountIn(amountConversion(AvailableAssetBalance))
            );
        } else {
            return null;
        }
    };

    const handleSubmitCreateLocker = () => {
        if (!address) {
            message.error("Address not found, please connect to Keplr");
            return;
        }
        setInProgress(true);
        message.info("Transaction initiated");
        signAndBroadcastTransaction(
            {
                message: {
                    typeUrl: "/comdex.locker.v1beta1.MsgCreateLockerRequest",
                    value: {
                        depositor: address,
                        amount: getAmount(inAmount),
                        assetId: Long.fromNumber(whiteListedAssetId),
                        appId: Long.fromNumber(PRODUCT_ID),
                    },
                },
                fee: defaultFee(),
            },
            address,
            (error, result) => {
                setInProgress(false);
                if (error) {
                    message.error(error);
                    return;
                }

                if (result?.code) {
                    message.info(result?.rawLog);
                    return;
                }
                message.success(
                    <Snack
                        message={variables[lang].tx_success}
                        hash={result?.transactionHash}
                    />
                );
                resetValues();
                dispatch({
                    type: "BALANCE_REFRESH_SET",
                    value: refreshBalance + 1,
                });
            }
        );
    };

    const handleWithdrawStableToken = () => {
        if (!address) {
            message.error("Address not found, please connect to Keplr");
            return;
        }
        setInProgress(true);
        message.info("Transaction initiated");

        console.log(
            address, "address",
            PRODUCT_ID, "appId",
            selectedExtentedPairVaultListData[0]?.id?.low, "extendedPairVaultId",
            getAmount(inAmount, selectedIBCAsset[0]?.coinDecimals), "amount",
            psmLockedAndMintedData?.id?.low, "stbale vault id"
        );
        signAndBroadcastTransaction(
            {
                message: {
                    typeUrl: "/comdex.vault.v1beta1.MsgWithdrawStableMintRequest",
                    value: {
                        from: address,
                        appId: Long.fromNumber(PRODUCT_ID),
                        extendedPairVaultId: Long.fromNumber(selectedExtentedPairVaultListData[0]?.id?.low),
                        amount: getAmount(inAmount, selectedIBCAsset[0]?.coinDecimals),
                        stableVaultId: Long.fromNumber(psmLockedAndMintedData?.id?.low),
                    },
                },
                fee: defaultFee(),
            },
            address,
            (error, result) => {
                setInProgress(false);
                if (error) {
                    message.error(error);
                    return;
                }

                if (result?.code) {
                    message.info(result?.rawLog);
                    return;
                }
                message.success(
                    <Snack
                        message={variables[lang].tx_success}
                        hash={result?.transactionHash}
                    />
                );
                resetValues();
                dispatch({
                    type: "BALANCE_REFRESH_SET",
                    value: refreshBalance + 1,
                });
            }
        );
    };

    return (
        <>
            <Col>
                <div className="farm-content-card earn-deposite-card earn-main-deposite">
                    <div className="locker-title">Stable Mint</div>
                    <div className="assets-select-card  ">
                        <div className="assets-left">
                            <label className="leftlabel">
                                Withdraw <TooltipIcon text="" />
                            </label>
                            <Row>
                                <Col>
                                    <div className="assets-select-wrapper">
                                        {loading ? <h1>Loading...</h1>
                                            :
                                            <React.Fragment>
                                                <div className="farm-asset-icon-container">
                                                    <div className="select-inner">
                                                        <div className="svg-icon">
                                                            <div className="svg-icon-inner">
                                                                <SvgIcon
                                                                    name={iconNameFromDenom(pair?.denomOut)}
                                                                />
                                                                <span
                                                                    style={{ textTransform: "uppercase" }}
                                                                >
                                                                    {denomToSymbol(pair?.denomOut)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        }
                                    </div>
                                </Col>
                            </Row>
                        </div>
                        <div className="assets-right">
                            <div className="label-right">
                                Available
                                <span className="ml-1">
                                    {amountConversionWithComma(AvailableAssetBalance, comdex?.coinDecimals, selectedIBCAsset[0]?.coinDecimals)} {denomConversion(pair?.denomOut)}
                                </span>
                                <div className="maxhalf">
                                    <Button className="active" onClick={() => handleInputMax()}>
                                        Max
                                    </Button>
                                </div>
                            </div>
                            <div className="input-select">
                                <CustomInput
                                    value={inAmount}
                                    onChange={(event) => {
                                        handleFirstInputChange(event.target.value);
                                    }}
                                    validationError={inputValidationError}
                                />
                                <small>{showInDollarValue()}</small>
                            </div>
                        </div>
                    </div>

                    <div className="interest-rate-container mt-4">
                        <Row>
                            <div className="title">Current Reward Rate</div>
                            <div className="value"> {collectorInfo?.lockerSavingRate
                                ? Number(
                                    decimalConversion(collectorInfo?.lockerSavingRate) * 100
                                ).toFixed(DOLLAR_DECIMALS)
                                : Number().toFixed(DOLLAR_DECIMALS)}%</div>
                        </Row>
                    </div>

                    <div className="assets PoolSelect-btn">
                        <div className="assets-form-btn text-center  mb-2">
                            <Button
                                loading={inProgress}
                                type="primary"
                                className="btn-filled"
                                onClick={() => {
                                    handleWithdrawStableToken()
                                }}
                            >
                                Withdraw
                            </Button>
                        </div>
                    </div>
                </div>
            </Col>
        </>
    );
};

Deposit.propTypes = {
    address: PropTypes.string.isRequired,
    assets: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.shape({
                low: PropTypes.number,
                high: PropTypes.number,
                inSigned: PropTypes.number,
            }),
            name: PropTypes.string.isRequired,
            denom: PropTypes.string.isRequired,
            decimals: PropTypes.shape({
                low: PropTypes.number,
                high: PropTypes.number,
                inSigned: PropTypes.number,
            }),
        })
    ),
    allWhiteListedAssets: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.shape({
                low: PropTypes.number,
                high: PropTypes.number,
                inSigned: PropTypes.number,
            }),
            name: PropTypes.string.isRequired,
            denom: PropTypes.string.isRequired,
            decimals: PropTypes.shape({
                low: PropTypes.number,
                high: PropTypes.number,
                inSigned: PropTypes.number,
            }),
        })
    ),
    whiteListedAsset: PropTypes.arrayOf(
        PropTypes.shape({
            list: PropTypes.shape({
                id: PropTypes.shape({
                    low: PropTypes.number,
                    high: PropTypes.number,
                    inSigned: PropTypes.number,
                }),
            }),
        })
    ),
    balances: PropTypes.arrayOf(
        PropTypes.shape({
            denom: PropTypes.string.isRequired,
            amount: PropTypes.string,
        })
    ),
    demandCoin: PropTypes.shape({
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        denom: PropTypes.string,
    }),
    refreshBalance: PropTypes.number.isRequired,
    ownerLockerInfo: PropTypes.string,
    pair: PropTypes.shape({
        denomIn: PropTypes.string,
        denomOut: PropTypes.string,
    }),
};
const stateToProps = (state) => {
    return {
        address: state.account.address,
        lang: state.language,
        balances: state.account.balances.list,
        pair: state.asset.pair,
        assets: state.asset._.list,
        allWhiteListedAssets: state.locker._.list,
        whiteListedAsset: state.locker.whiteListedAssetById.list,
        refreshBalance: state.account.refreshBalance,
        ownerLockerInfo: state.locker.ownerVaultInfo,
    };
};

const actionsToProps = {
    setPair,
    setAssets,
    setAllWhiteListedAssets,
    setWhiteListedAssets,
    setOwnerVaultInfo,
    setCollectorData,
    setAmountIn,
    setAmountOut,
    setAssetIn,
    setAssetOut,
};
export default connect(stateToProps, actionsToProps)(Deposit);