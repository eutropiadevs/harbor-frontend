import * as PropTypes from "prop-types";
import { Col, Row, SvgIcon } from "../../../../components/common";
import { connect, useSelector } from "react-redux";
import { Button, message, Steps, Table } from "antd";
import "./index.scss";
import TooltipIcon from "../../../../components/TooltipIcon";
import { Link } from "react-router-dom";
import { useParams } from "react-router";
import { airdropMissionBorrow, airdropMissionLiquidity, airdropMissionMint, airdropMissionVote, checkEligibility, claimHarbor, claimveHarbor, timeLeftToClaim, unClaimveHarbor } from "../../../../services/airdropContractRead";
import { useEffect } from "react";
import { useState } from "react";
import { amountConversionWithComma } from "../../../../utils/coin";
import { unixToGMTTime } from "../../../../utils/string";
import { MyTimer } from "../../../../components/TimerForAirdrop";
import { setuserEligibilityData } from "../../../../actions/airdrop";
import { missions } from "./mission";
import { setBalanceRefresh } from "../../../../actions/account";
import { transactionForClaimActivityMission, transactionForClaimLiquidHarbor } from "../../../../services/airdropContractWrite";
import { useNavigate } from 'react-router-dom';


const { Step } = Steps;

const CompleteMission = ({
  lang,
  address,
  userEligibilityData,
  setuserEligibilityData,
  refreshBalance,
  setBalanceRefresh
}) => {

  const { chainId } = useParams();
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [counterEndTime, setCounterEndTime] = useState(0);
  const [userClaimHarbor, setUserClaimHarbor] = useState(0);
  const [userClaimveHarbor, setUserClaimveHarbor] = useState(0);
  const [userUnClaimveHarbor, setUserUnClaimveHarbor] = useState(0);
  const [airdropMission, setAirdropMission] = useState({
    mint: false,
    vote: false,
    lend: false,
    liquidity: false,
  })

  // Query 

  const fetchTimeLeftToClaim = () => {
    timeLeftToClaim().then((res) => {
      setTotalTimeLeft(res)
    }).catch((error) => {
      console.log(error);
    })
  }

  const fetchCheckEligibility = (address, chainId) => {
    setLoading(true)
    checkEligibility(address, chainId).then((res) => {
      console.log(res);
      if (res == null) {
        navigate(`/more/airdrop`)
      } else {
        setuserEligibilityData(res)
        setLoading(false)
      }
    }).catch((error) => {
      console.log(error);
      setLoading(false)
    })
  }

  const fetchClaimHarbor = (address, chainId) => {
    claimHarbor(address, chainId).then((res) => {
      setUserClaimHarbor(res)
    }).catch((error) => {
      console.log(error);
    })
  }

  const fetchClaimveHarbor = (address, chainId) => {
    claimveHarbor(address, chainId).then((res) => {
      setUserClaimveHarbor(res)
    }).catch((error) => {
      console.log(error);
    })
  }

  const fetchUnClaimveHarbor = (address, chainId) => {
    unClaimveHarbor(address, chainId).then((res) => {
      setUserUnClaimveHarbor(res)
    }).catch((error) => {
      console.log(error);
    })
  }

  const fetchAirdropMissionMint = (address) => {
    airdropMissionMint(address).then((res) => {
      setAirdropMission((prevState) => ({ ...prevState, ["mint"]: res }))
    }).catch((error) => {
      console.log(error);
    })
  }

  const fetchAirdropMissionVote = (address) => {
    airdropMissionVote(address).then((res) => {
      setAirdropMission((prevState) => ({ ...prevState, ["vote"]: res }))
    }).catch((error) => {
      console.log(error, "vote error");
    })
  }

  const fetchAirdropMissionLiquidity = (address) => {
    airdropMissionLiquidity(address).then((res) => {
      setAirdropMission((prevState) => ({ ...prevState, ["liquidity"]: res }))
    }).catch((error) => {
      console.log(error);
    })
  }

  const fetchAirdropMissionBorrow = (address) => {
    airdropMissionBorrow(address).then((res) => {
      setAirdropMission((prevState) => ({ ...prevState, ["lend"]: res }))
    }).catch((error) => {
      console.log(error);
    })
  }

  const checkCalculateCompletedMissionStape = () => {
    let MissionClaimeArray = userEligibilityData?.claimed;
    MissionClaimeArray = MissionClaimeArray?.filter(Boolean).length;
    setCurrentStep(MissionClaimeArray - 1)
  }

  const calculateMissionPercentage = () => {
    let MissionClaimeArray = userEligibilityData?.claimed;
    let MissionClaimeArrayLength = MissionClaimeArray?.length;
    MissionClaimeArray = MissionClaimeArray?.filter(Boolean).length;
    MissionClaimeArray = (MissionClaimeArray / MissionClaimeArrayLength) * 100;
    return MissionClaimeArray || 0;
  }


  const handleClaimMissionReward = (address, chainId, activity, currentId) => {
    setCurrent(currentId)
    setLoading(true)
    if (address) {
      if (activity === "liquid") {
        transactionForClaimLiquidHarbor(address, chainId, (error, result) => {
          if (error) {
            message.error(error)
            setLoading(false)
            return;
          }
          message.success("Success")
          setBalanceRefresh(refreshBalance + 1);
          setLoading(false)
        })
      } else {
        transactionForClaimActivityMission(address, chainId, activity, (error, result) => {
          if (error) {
            message.error(error)
            setLoading(false)
            return;
          }
          message.success("Success")
          setBalanceRefresh(refreshBalance + 1);
          setLoading(false)
        })
      }


    }
    else {
      setLoading(false)
      message.error("Please Connect Wallet")
    }
  }



  useEffect(() => {
    fetchTimeLeftToClaim()
    if (address && Number(chainId)) {
      fetchCheckEligibility(address, Number(chainId))
      fetchClaimHarbor(address, Number(chainId))
      fetchClaimveHarbor(address, Number(chainId))
      fetchUnClaimveHarbor(address, Number(chainId))
    }
  }, [address, chainId])

  useEffect(() => {
    if (address) {
      fetchAirdropMissionMint(address)
      fetchAirdropMissionVote(address)
      fetchAirdropMissionLiquidity(address)
      fetchAirdropMissionBorrow(address)
    }
  }, [address, refreshBalance])

  useEffect(() => {
    checkCalculateCompletedMissionStape()
    calculateMissionPercentage()
  }, [address, userEligibilityData, refreshBalance])


  useEffect(() => {
    if (totalTimeLeft) {
      setCounterEndTime(unixToGMTTime(totalTimeLeft))
    }
  }, [totalTimeLeft])

  const time = new Date(counterEndTime);
  time.setSeconds(time.getSeconds());

  const columns = [
    {
      title: "Asset",
      dataIndex: "asset",
      key: "asset",
      width: 120,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 120,
      align: "right",
      render: (item, index) =>
        <>
          <Button type="primary"
            disabled={
              loading
              || userEligibilityData && userEligibilityData?.claimed?.[item?.id - 1]
              || !airdropMission[item?.name]
              // || !airdropMission[item?.name] && !userEligibilityData?.claimed?.[item?.id - 1]

            }
            loading={item?.id === current ? loading : false}
            className="btn-filled ml-3"
            onClick={() => {
              console.log(airdropMission[item?.name], userEligibilityData?.claimed?.[item?.id - 1]);
              handleClaimMissionReward(address, Number(chainId), item?.name, item?.id)
            }
            }>
            {userEligibilityData && userEligibilityData?.claimed?.[item?.id - 1] ? "Claimed" : "Claim"}
          </Button>
          {item?.path && <a href={item?.path} target="_blank"> <Button className="ml-3" type="primary">Take me there</Button></a>}
        </>
    },
  ];

  const tableData =
    missions && missions?.map((item, index) => {
      return {
        key: item?.id,
        asset: (
          <>
            <div className="assets-withicon">
              <div className="left-icon"><SvgIcon name={item?.icon} viewbox={item?.viewBox} /></div>
              {item?.title}
            </div>
          </>
        ),
        action: item, index
      }
    })


  return (
    <div className="app-content-wrapper">
      <Row className="text-right">
        <Col>
          <Link to="/more/airdrop"><Button type="primary" className="btn-filled px-4">Back</Button></Link>
        </Col>
      </Row>
      <Row>
        <Col lg="6" className="mt-4">
          <div className="mission-card claim-airdrop-card">
            <div className="claim-airdrop-head">
              <h2>Claim Airdrop</h2>
              <div className="head-right">
                {/* <span>Time Left</span> 10 <small>D</small> 21 <small>H</small> 24 <small>M</small> */}
                {counterEndTime ? <MyTimer expiryTimestamp={time} text={"Time Left"} />
                  :
                  <div><span>Time Left</span> 0 <small>D</small> 0 <small>H</small> 0 <small>M</small> 0 <small>S</small>  </div>
                }
              </div>
            </div>
            <Row>
              <Col md='6'>
                <div className="airdrop-statics">
                  <p className="total-value">Claimed veHarbor Airdrop <TooltipIcon text="Airdrop  which has been claimed across all chains and liquidity pools" /></p>
                  <h2>{amountConversionWithComma(userClaimveHarbor || 0)} <sub className="text-uppercase">harbor</sub></h2>
                </div>
              </Col>
              <Col md='6'>
                <div className="airdrop-statics">
                  <p className="total-value">Unclaimed veHarbor Airdrop <TooltipIcon text="$veHarbor claimed across all chains and liquidity pools after completing the missions with a locking period of 1 year" /></p>
                  <h2>{amountConversionWithComma(userUnClaimveHarbor || 0)} <sub>ve</sub><sub className="text-uppercase">harbor</sub></h2>
                </div>
              </Col>
              <Col md='6'>
                <div className="airdrop-statics">
                  <p className="total-value">Claimed Harbor Airdrop <TooltipIcon text="$veHarbor claimed across all chains and liquidity pools after completing the missions with a locking period of 1 year" /></p>
                  <h2>{amountConversionWithComma(userClaimHarbor || 0)} <sub>ve</sub><sub className="text-uppercase">harbor</sub></h2>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
        <Col lg="6" className="mt-4">
          <div className="mission-card progress-card">
            <div className="progress-airdrop-head">
              <h2>Your Progress</h2>
              <div className="head-right">{userEligibilityData && calculateMissionPercentage() || 0}% Complete</div>
            </div>
            <div className="mt-4 pt-3">
              <Steps size="small" current={currentStep} labelPlacement="vertical" icon={<SvgIcon name="plane-icon" viewbox="0 0 54 50" />} >
                {/* <Step title="20%" icon={<SvgIcon name="check" viewbox="0 0 13.062 10.393" />} />
                <Step title="40%" icon={<SvgIcon name="plane-icon" viewbox="0 0 54 50" />} /> */}
                <Step title="20%" key={0} icon={currentStep === 0 ? <SvgIcon name="plane-icon" viewbox="0 0 54 50" /> : ""} />
                <Step title="40%" key={1} icon={currentStep === 1 ? <SvgIcon name="plane-icon" viewbox="0 0 54 50" /> : ""} />
                <Step title="60%" key={2} icon={currentStep === 2 ? <SvgIcon name="plane-icon" viewbox="0 0 54 50" /> : ""} />
                <Step title="80%" key={3} icon={currentStep === 3 ? <SvgIcon name="plane-icon" viewbox="0 0 54 50" /> : ""} />
                <Step title="100%" key={4} icon={currentStep === 4 ? <SvgIcon name="plane-icon" viewbox="0 0 54 50" /> : ""} />
              </Steps>
            </div>
          </div>
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <h2 className="mission-title">Mission</h2>
          <div className="composite-card pb-3">
            <div className="card-content">
              <Table
                className="custom-table mission-table"
                dataSource={tableData}
                columns={columns}
                pagination={false}
                showHeader={false}
                scroll={{ x: "100%" }}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

CompleteMission.propTypes = {
  lang: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  refreshBalance: PropTypes.number.isRequired,
  userEligibilityData: PropTypes.object.isRequired,
};

const stateToProps = (state) => {
  return {
    lang: state.language,
    address: state.account.address,
    refreshBalance: state.account.refreshBalance,
    userEligibilityData: state.airdrop.userEligibilityData,
  };
};

const actionsToProps = {
  setuserEligibilityData,
  setBalanceRefresh,
};

export default connect(stateToProps, actionsToProps)(CompleteMission);