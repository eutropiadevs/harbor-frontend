import * as PropTypes from "prop-types";
import { Col, Row } from "../../components/common";
import { connect } from "react-redux";
import React, { useState } from "react";
import { Tabs } from "antd";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import CustomInput from "../../components/CustomInput";
import { useDispatch } from "react-redux";
import { setAmountIn } from "../../actions/asset";
import { useSelector } from "react-redux";
import { toDecimals } from "../../utils/string";
import { calculateROI } from "../../utils/number";

const Earn = () => {
  const dispatch = useDispatch();
  const [defaultTabSelect, setDefaultTabSelect] = useState("1");
  const { TabPane } = Tabs;
  const [principal, setPrincipal] = useState();
  const [years, setYears] = useState(1);
  const [months, setMonths] = useState(0);
  const [days, setDays] = useState(0);
  const [interestRate, setInterestRate] = useState(6);
  const [totalROI, setTotalROI] = useState();

  const isLockerExist = useSelector((state) => state.locker.isLockerExist);

  const onChangePrincipal = (value) => {
    value = toDecimals(value).toString().trim();
    setPrincipal(value);
    checkCalculation(value);
  };

  const checkCalculation = (
    principal,
    yearsInput = years,
    monthsInput = months,
    daysInput = days
  ) => {
    if (principal && interestRate && yearsInput) {
      setTotalROI(
        calculateROI(
          principal,
          interestRate,
          yearsInput,
          monthsInput,
          daysInput
        )
      );
    }
  };

  const onChangeYears = (value) => {
    value = toDecimals(value).toString().trim();

    if (Number(value) <= 10) {
      setYears(value);
      checkCalculation(principal, value);
    }
  };

  const onChangeMonths = (value) => {
    value = toDecimals(value).toString().trim();

    if (Number(value) <= 12) {
      setMonths(value);
      checkCalculation(principal, years, value);
    }
  };

  const onChangeDays = (value) => {
    value = toDecimals(value).toString().trim();
    if (Number(value) <= 30) {
      setDays(value);
      checkCalculation(principal, years, months, value);
    }
  };

  const callback = (key) => {
    dispatch(setAmountIn(0));
    setDefaultTabSelect(key);
  };


  return (
    <>
      <div className="app-content-wrapper">
        <Row className="earn-main-container">
          <Col>
            <Tabs
              className="comdex-tabs"
              type="card"
              activeKey={defaultTabSelect}
              onChange={callback}
              className="comdex-tabs farm-modal-tab"
            >
              <TabPane tab="Deposit" key="1">
                <Deposit />
              </TabPane>
              <TabPane tab="Withdraw" key="2" disabled={!isLockerExist}>
                <Withdraw />
              </TabPane>
            </Tabs>
          </Col>

          <Col>
            <div className="earn-deposite-card calculator-main-container">
              <div className="calculator-title">Calculator</div>
              <div className="calculator-container">
                <div className="content-container">
                  <div className="left-container">Total Investment (CMST)</div>
                  <div className="right-container">
                    <div className="input-container">
                      <CustomInput
                        className=""
                        placeholder="0.00"
                        value={principal}
                        onChange={(event) =>
                          onChangePrincipal(event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="content-container time-content-container">
                  <div className="left-container">Time Period</div>
                  <div className="right-container">
                    <div className="input-container">
                      <div className="year-container">
                        <CustomInput
                          className=""
                          placeholder="0"
                          value={years}
                          onChange={(event) =>
                            onChangeYears(event.target.value)
                          }
                        />
                      </div>
                      <div className="month-container">
                        <CustomInput
                          className=""
                          placeholder="0"
                          value={months}
                          max={12}
                          onChange={(event) =>
                            onChangeMonths(event.target.value)
                          }
                        />
                      </div>
                      <div className="day-container">
                        <CustomInput
                          className=""
                          placeholder="0"
                          value={days}
                          max={31}
                          onChange={(event) => onChangeDays(event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-container">
                  <div className="left-container">Expected Interest</div>
                  <div className="right-container">{interestRate}%</div>
                </div>
                <div className="content-container">
                  <div className="left-container">Total Value</div>
                  <div className="right-container">{totalROI || 0} CMST</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
};
Earn.propTypes = {
  lang: PropTypes.string.isRequired,
};

const stateToProps = (state) => {
  return {
    lang: state.language,
  };
};
const actionsToProps = {};
export default connect(stateToProps, actionsToProps)(Earn);